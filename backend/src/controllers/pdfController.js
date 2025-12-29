// controllers/pdfController.js
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const { CarChecklist } = require("../schema/carChecklist.schema");
const { MaterialChecklist } = require("../schema/materialChecklist.schema");
const { Car } = require("../schema/car.schema");
const { User } = require("../schema/user.schema");
const { fastify } = require("../init");
const LoggingService = require("../services/LoggingService");

// Create a component-specific logger
const logger = LoggingService.getComponentLogger("PDFController");

// PDF output directory
const PDF_OUTPUT_DIR = "/var/data";

// Ensure PDF output directory exists
const ensurePdfDirectory = () => {
  try {
    if (!fs.existsSync(PDF_OUTPUT_DIR)) {
      fs.mkdirSync(PDF_OUTPUT_DIR, { recursive: true });
      logger.info(`Created PDF output directory: ${PDF_OUTPUT_DIR}`);
    }
  } catch (error) {
    logger.error(`Failed to create PDF output directory: ${error.message}`, error);
  }
};

// Helper to generate consistent filenames
const generateFilename = (prefix, username, carName, date) => {
  // Force Europe/Rome timezone for consistency across environments
  const dateStr = date.toLocaleDateString("it-IT", { timeZone: "Europe/Rome" }).replace(/\//g, "-");
  const timeStr = date.toLocaleTimeString("it-IT", { timeZone: "Europe/Rome" });
  return `${prefix}-${username}-${carName}-${dateStr}-${timeStr}`;
};

const printCarChecklist = async (request) => {
  try {
    logger.debug(`Starting car checklist PDF generation for checklistId: ${request.checklistId}`);
    
    // Ensure output directory exists
    ensurePdfDirectory();
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    logger.debug("Puppeteer browser launched successfully");
    
    const page = await browser.newPage();

    // Fetch checklist from database or request body
    const { checklistId, items, photos } = request;
    logger.debug(`Generating PDF with ${items?.length || 0} items and ${photos?.length || 0} photos`);
    
    const carChecklist = await CarChecklist.findById(checklistId)
      .populate("car")
      .populate("user");

    const car = await Car.findById(carChecklist.car._id.toString());
    const damages = car.damages;

    // Load van images - use path.join for proper path resolution
    const imgBasePath = path.join(process.cwd(), 'backend', 'img', 'van');
    const VAN_IMAGES = {
      front: fs.readFileSync(path.join(imgBasePath, 'front.png')),
      back: fs.readFileSync(path.join(imgBasePath, 'back.png')),
      left: fs.readFileSync(path.join(imgBasePath, 'left.png')),
      right: fs.readFileSync(path.join(imgBasePath, 'right.png')),
    };

    // Use consistent filename format
    const filename = generateFilename(
      "checklist",
      carChecklist.user.username,
      carChecklist.car.name,
      carChecklist.created_at
    );

    const logo = fs
      .readFileSync(path.join(process.cwd(), 'backend', 'img', 'logo.png'))
      .toString("base64");

    // Generate table rows based on the checklist items
    let checklistRows = "";

    if (items) {
      // New format with inventory items
      checklistRows = items
        .map((item) => {
          const status = item.is_present ? "✔" : "✘";

          return `
        <tr>
          <td>${item.name}</td>
          <td>${status}</td>
          <td>-</td>
        </tr>`;
        })
        .join("");
    }

    const COLORS = ["#FBBF24", "#3B82F6", "#22C55E", "#ADD8E6", "#FFC0CB"];
    // Generate Car Damage Points Display for all damages and sides
    const damagePoints = Object.entries(damages).map(([side, points]) => {
      const image = VAN_IMAGES[side];
      const pointsDisplay = points
        .map((point) => {
          return `
            <div style="
              position: absolute; 
              top: ${point.y}px; 
              left: ${point.x}px; 
              background-color: ${COLORS[point.colorIndex]}; 
              width: 24px; 
              height: 24px;
              border-radius: 50%;
              border: 2px solid black;
            "
             ></div>
          `;
        })
        .join("");
      return `
        <div style="position: relative; width: 375px; margin-bottom: 20px;">
          <img src="data:image/png;base64,${image.toString(
            "base64"
          )}" alt="${side}" 
          style="
            width: 100%;
            height: 100%;
            aspect-ratio: 1;
            object-fit: contain;
          "
          />
          ${pointsDisplay}
        </div>
      `;
    });
    const renderPhotos = () => {
      return `
      <div style="display: flex; justify-content: center; gap: 20px; margin-bottom: 20px; flex-wrap: wrap; margin-top: 30px">
        ${photos.map(
          (item) => `
        <div style="width: 200px; margin-bottom: 20px;">
          <img
            src="${item}" 
            style="
              width: 100%;
              height: auto;
            "
          />
        </div>
      `
        )}
      </div>    
    `;
    };
    // Set your HTML content here
    const htmlContent = `
    <html>
    <head>
        <title>Checklist Mezzo ${carChecklist.car.name}</title> 
    </head>
    <body>
      <table class="headerTable">
        <tr>
          <td><img src="data:image/png;base64,${logo}" alt="Logo" /></td>
          <td><h3>Checklist Mezzo ${carChecklist.car.name}</h3></td>
          <td>${carChecklist.created_at.toLocaleDateString("it-IT")}</td>
        </tr>
      </table>
      <table id="mainTable">
        <thead>
            <tr>
                <th>Elemento</th>
                <th>Valore</th>
                <th>Note</th>
            </tr>
        </thead>
        <tbody>
        <tr>
          <td>Nome</td>
          <td>${carChecklist.car.name}</td>
          <td>-</td>
        </tr>
        <tr>
          <td>Marca</td>
          <td>${carChecklist.car.meta.brand}</td>
          <td>-</td>
        </tr>
        <tr>
          <td>Modello</td>
          <td>${carChecklist.car.meta.model}</td>
          <td>-</td>
        </tr>
        <tr>
          <td>Targa</td>
          <td>${carChecklist.car.meta.plate_number}</td>
          <td>-</td>
        </tr>
        <tr>
          <td>Autista</td>
          <td>${carChecklist.user.first_name} ${
      carChecklist.user.last_name
    }</td>
          <td>-</td>
        </tr>
        <tr>
          <td>Inizio turno</td>
          <td>${
            carChecklist.car.shift_start.toLocaleDateString("it-IT") +
            " " +
            carChecklist.car.shift_start.toLocaleTimeString("it-IT")
          }</td>
          <td>-</td>
        </tr>
        <tr>
          <td>Chilometri</td>
          <td>${carChecklist.car.meta.kilometers}km</td>
          <td>-</td>
        </tr>
        <tr>
          <td>Livello carburante</td>
          <td>${carChecklist.car.meta.carbon_level}%</td>
          <td>-</td>
        </tr>
            ${checklistRows}
        </tbody>
      </table>

      <table class="headerTable" style="margin-bottom: 30px">
        <tr>
          <td><img src="data:image/png;base64,${logo}" alt="Logo" /></td>
          <td><h3>Punti di danno</h3></td>
          <td>${carChecklist.created_at.toLocaleDateString("it-IT")}</td>
        </tr>
      </table>
      ${renderPhotos()}
      <div style="display: flex; justify-content: center; gap: 20px; margin-bottom: 20px; flex-wrap: wrap;">
      ${damagePoints.join("")}
      </div>
      <div
      style="
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem;
        max-width: 420px;
        justify-content: space-evenly;
        margin: auto;
      "
    >
      <div
        style="
          display: flex;
          align-items: center;
          margin-top: 0.25rem;
          margin-bottom: 0.25rem;
        "
      >
        <div
          style="
            width: 20px;
            height: 20px;
            border: 1px solid black;
            border-radius: 4px;
            margin-right: 0.25rem;
            background-color: rgb(251, 191, 36);
          "
        ></div>
        <span>Strisciata</span>
      </div>
      <div
        style="
          display: flex;
          align-items: center;
          margin-top: 0.25rem;
          margin-bottom: 0.25rem;
        "
      >
        <div
          style="
            width: 20px;
            height: 20px;
            border: 1px solid black;
            border-radius: 4px;
            margin-right: 0.25rem;
            background-color: rgb(59, 130, 246);
          "
        ></div>
        <span>Ammaccatura</span>
      </div>
      <div
        style="
          display: flex;
          align-items: center;
          margin-top: 0.25rem;
          margin-bottom: 0.25rem;
        "
      >
        <div
          style="
            width: 20px;
            height: 20px;
            border: 1px solid black;
            border-radius: 4px;
            margin-right: 0.25rem;
            background-color: rgb(34, 197, 94);
          "
        ></div>
        <span>Pezzo mancante</span>
      </div>
      <div
        style="
          display: flex;
          align-items: center;
          margin-top: 0.25rem;
          margin-bottom: 0.25rem;
        "
      >
        <div
          style="
            width: 20px;
            height: 20px;
            border: 1px solid black;
            border-radius: 4px;
            margin-right: 0.25rem;
            background-color: rgb(173, 216, 230);
          "
        ></div>
        <span>Rottura</span>
      </div>
      <div
        style="
          display: flex;
          align-items: center;
          margin-top: 0.25rem;
          margin-bottom: 0.25rem;
        "
      >
        <div
          style="
            width: 20px;
            height: 20px;
            border: 1px solid black;
            border-radius: 4px;
            margin-right: 0.25rem;
            background-color: rgb(255, 192, 203);
          "
        ></div>
        <span>Altro</span>
      </div>
    </div>
      <style>
      @page {
        size: A4;
        margin: 10mm;
      }
      html {
        font-size: 20px !important;
      }
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
        background-color: white;
      }
        .headerTable {
            width: 100%;
            max-width: 800px;
            margin: 0 auto 20px;
            border: 0;
        }
        .headerTable h3, .headerTable td {
            margin: 0;
            text-align: center;
        }
        .headerTable img {
            width: 40px;
            height: 40px;
            object-fit: contain;
            display: block;
            margin: 0 auto;
        }
        #mainTable {
            width: 100%;
            border-collapse: collapse;
        page-break-after: always;
        }
        #mainTable th, #mainTable td {
            border: 1px solid black;
            padding: 8px 4px;
            text-align: center;
            font-weight: 500;
        }
        #mainTable th {
            background-color: #f2f2f2;
            font-weight: 600;
        }
      </style>
    </body>
    </html>
  `;
    await page.setContent(htmlContent);

    const pdfPath = `${PDF_OUTPUT_DIR}/${filename}.pdf`;
    logger.debug(`Writing car checklist PDF to: ${pdfPath}`);
    
    await page.pdf({
      path: pdfPath,
      format: "A4",
      scale: 0.8,
      printBackground: true,
    });
    await browser.close();

    // Verify PDF was created
    if (fs.existsSync(pdfPath)) {
      const stats = fs.statSync(pdfPath);
      logger.info(`Successfully generated car checklist PDF: ${filename} (${stats.size} bytes)`);
    } else {
      logger.error(`PDF file was not created: ${pdfPath}`);
    }
    
    return {
      statusCode: 200,
      filename: filename,
    };
  } catch (error) {
    logger.error(`Error generating car checklist PDF: ${error.message}`, error);
    return {
      statusCode: 500,
      message: "Error generating PDF",
    };
  }
};

// Helper function to get a material checklist by ID
const getMaterialChecklist = async (checklistId) => {
  try {
    return await MaterialChecklist.findOne({
      _id: checklistId,
    })
      .populate({
        path: "items.item",
        model: "InventoryItem",
      })
      .populate("car", "name _id meta")
      .populate("user", "first_name last_name _id")
      .exec();
  } catch (err) {
    logger.error(`Error getting material checklist: ${err.message}`, err);
    return null;
  }
};

const materialChecklistToFormattedData = async (materialChecklist, userId) => {
  try {
    // Format date and time
    const checklistDate = new Date(materialChecklist.created_at);
    const formattedDate = checklistDate.toLocaleDateString("it-IT");
    const formattedTime = checklistDate.toLocaleTimeString("it-IT");

    // Get user and car information
    const user = await User.findById(userId);
    const car = materialChecklist.car;

    if (!user || !car) {
      return { error: "User or car not found" };
    }

    // Create formatted checklist object
    const formattedChecklist = {
      date: formattedDate,
      time: formattedTime,
      user: `${user.first_name.toLowerCase()}${user.last_name.toLowerCase()}`,
      car: car.name,
      report: materialChecklist.report || "",
      unmarked_materials: materialChecklist.unmarked_materials || "",
      mainTable: [],
      traumaTable: [],
      oxygenTable: [],
      borsaTable: [],
      cassettiTable: [],
    };

    // Categorize items based on their category and subcategory
    const categorizedItems = {
      main: {},
      trauma: {},
      oxygen: {},
      borsa: {},
      cassetti: {},
    };

    // Group items by category and subcategory
    materialChecklist.items.forEach((item) => {
      const inventoryItem = item.item;
      if (!inventoryItem) return;

      const category = (inventoryItem.category || "main").toLowerCase();
      const subcategory = inventoryItem.subcategory || "Default";

      if (!categorizedItems[category][subcategory]) {
        categorizedItems[category][subcategory] = [];
      }

      categorizedItems[category][subcategory].push({
        name: inventoryItem.name,
        quantity: inventoryItem.minimum_quantity || 1,
        value: item.quantity,
      });
    });

    // Convert categorized items to format expected by the template
    Object.keys(categorizedItems).forEach((category) => {
      const targetArray = formattedChecklist[`${category}Table`];
      if (!targetArray) return;

      Object.keys(categorizedItems[category]).forEach((subcategory) => {
        const items = categorizedItems[category][subcategory];
        if (items.length > 0) {
          targetArray.push({
            category: subcategory,
            items: items,
          });
        }
      });
    });

    return formattedChecklist;
  } catch (error) {
    logger.error(`Error formatting material checklist: ${error.message}`, error);
    return { error: "Error formatting material checklist" };
  }
};

const printMaterialChecklist = async (checklistId, checklist) => {
  try {
    logger.debug(`Starting material checklist PDF generation for checklistId: ${checklistId}`);
    
    // Ensure output directory exists
    ensurePdfDirectory();
    
    const materialChecklist = await MaterialChecklist.findById(checklistId)
      .populate("car")
      .populate("user");

    // Use consistent filename format
    const filename = generateFilename(
      "checklist_inf",
      materialChecklist.user.username,
      materialChecklist.car.name,
      materialChecklist.created_at
    ) + ".pdf";
    
    logger.debug(`Will generate PDF: ${filename}`);

    // Launch a browser instance
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    logger.debug("Puppeteer browser launched successfully");
    
    const page = await browser.newPage();

    // Read the HTML template
    const htmlTemplatePath = path.join(process.cwd(), 'backend', 'src', 'html', 'material_page.html');
    logger.debug(`Reading HTML template from: ${htmlTemplatePath}`);
    const htmlContent = fs.readFileSync(
      htmlTemplatePath,
      "utf-8"
    );

    // Inject the checklist data into the template
    if (!checklist) {
      logger.warn("Checklist data is undefined or null");
    } else {
      logger.debug(`Checklist has keys: ${Object.keys(checklist).join(', ')}`);
    }
    
    let newContent = htmlContent.replace(
      "</head>",
      `<script>const checklist = ${JSON.stringify(checklist)};</script></head>`
    );

    await page.setContent(newContent, { waitUntil: "networkidle0" });

    // Generate PDF
    const pdfPath = `${PDF_OUTPUT_DIR}/${filename}`;
    logger.debug(`Writing PDF to: ${pdfPath}`);
    
    await page.pdf({
      path: pdfPath,
      format: "A4",
      scale: 0.8,
      printBackground: true,
    });

    // Close the browser
    await browser.close();

    // Verify PDF was created
    if (fs.existsSync(pdfPath)) {
      const stats = fs.statSync(pdfPath);
      logger.info(`Successfully generated material checklist PDF: ${filename} (${stats.size} bytes)`);
    } else {
      logger.error(`PDF file was not created: ${pdfPath}`);
    }
    
    return {
      statusCode: 200,
      message: "PDF generated successfully",
      filename: filename,
    };
  } catch (error) {
    logger.error(`Error generating material checklist PDF: ${error.message}`, error);
    return { statusCode: 500, message: "Error generating PDF" };
  }
};

const findPDF = async (request, reply) => {
  const checklistId = request.checklistId || request.params?.id || request.query?.checklistId || request.body?.checklistId;
  
  const carChecklist = await CarChecklist.findById(checklistId)
    .populate("car")
    .populate("user");
  const materialChecklist = await MaterialChecklist.findById(checklistId)
    .populate("car")
    .populate("user");

  let filePath;
  let downloadName;

  if (carChecklist) {
    // Try consistent format
    const filename = generateFilename(
      "checklist",
      carChecklist.user.username,
      carChecklist.car.name,
      carChecklist.created_at
    );
    const consistentPath = `/var/data/${filename}.pdf`;
    
    // Try ID-based format (fallback for any created during the brief change)
    const idPath = `/var/data/checklist-${carChecklist._id}.pdf`;

    if (fs.existsSync(consistentPath)) {
      filePath = consistentPath;
    } else if (fs.existsSync(idPath)) {
      filePath = idPath;
    }

    // Construct descriptive name for download
    const formattedDate = carChecklist.created_at.toLocaleDateString("it-IT", { timeZone: "Europe/Rome" }).replace(/\//g, "-");
    downloadName = `checklist-${carChecklist.user.username}-${carChecklist.car.name}-${formattedDate}.pdf`;

  } else if (materialChecklist) {
    // Try consistent format
    const filename = generateFilename(
      "checklist_inf",
      materialChecklist.user.username,
      materialChecklist.car.name,
      materialChecklist.created_at
    ) + ".pdf";
    const consistentPath = `/var/data/${filename}`;

    // Try ID-based format (fallback)
    const idPath = `/var/data/checklist_inf-${materialChecklist._id}.pdf`;

    if (fs.existsSync(consistentPath)) {
      filePath = consistentPath;
    } else if (fs.existsSync(idPath)) {
      filePath = idPath;
    }

    // Construct descriptive name for download
    const formattedDate = materialChecklist.created_at.toLocaleDateString("it-IT", { timeZone: "Europe/Rome" }).replace(/\//g, "-");
    downloadName = `checklist_inf-${materialChecklist.user.username}-${materialChecklist.car.name}-${formattedDate}.pdf`;
  }

  if (filePath && fs.existsSync(filePath)) {
    const fileStream = fs.createReadStream(filePath);
    // download the PDF
    reply.header("Content-Type", "application/pdf");
    reply.header(
      "Content-Disposition",
      `attachment; filename=${downloadName || path.basename(filePath)}`
    );
    reply.send(fileStream);
  } else {
    return reply.code(404).send({
      message: "Checklist PDF not found",
    });
  }
};

const getPdfForChecklist = async (request, reply) => {
  try {
    // Delegate to findPDF which handles both types and correct paths
    request.checklistId = request.params.id;
    return findPDF(request, reply);
  } catch (error) {
    logger.error(`Error fetching PDF: ${error.message}`, error);
    return reply.code(500).send({
      message: "Error retrieving PDF",
    });
  }
};

// Register routes
const pdfRoutes = () => {
  fastify.get(
    "/api/checklist/:id/pdf",
    { preHandler: [fastify.authenticate] },
    getPdfForChecklist
  );
};

module.exports = {
  pdfRoutes,
  printCarChecklist,
  printMaterialChecklist,
  findPDF,
};
