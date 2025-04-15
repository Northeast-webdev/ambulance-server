// controllers/pdfController.js
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const { CarChecklist } = require("../schema/carChecklist.schema");
const { MaterialChecklist } = require("../schema/materialChecklist.schema");
const { Car } = require("../schema/car.schema");
const { User } = require("../schema/user.schema");
const { fastify } = require("../init");

const printCarChecklist = async (request) => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Fetch checklist from database or request body
    const { checklistId, items, photos } = request;
    const carChecklist = await CarChecklist.findById(checklistId)
      .populate("car")
      .populate("user");

    const car = await Car.findById(carChecklist.car._id.toString());
    const damages = car.damages;

    // Load van images
    const VAN_IMAGES = {
      front: fs.readFileSync(`${process.cwd()}/img/van/front.png`),
      back: fs.readFileSync(`${process.cwd()}/img/van/back.png`),
      left: fs.readFileSync(`${process.cwd()}/img/van/left.png`),
      right: fs.readFileSync(`${process.cwd()}/img/van/right.png`),
    };

    const filename =
      "checklist-" +
      carChecklist.user.username +
      "-" +
      carChecklist.car.name +
      "-" +
      carChecklist.created_at.toLocaleDateString("it-IT").replace(/\//g, "-") +
      "-" +
      carChecklist.created_at.toLocaleTimeString("it-IT");

    const logo = fs
      .readFileSync(`${process.cwd()}/img/logo.png`)
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

    await page.pdf({
      path: `/var/data/${filename}.pdf`,
      format: "A4",
      scale: 0.8,
      printBackground: true,
    });
    await browser.close();

    return {
      statusCode: 200,
      filename: filename,
    };
  } catch (error) {
    console.error("Error generating PDF:", error);
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
    console.error("Error getting material checklist:", err);
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
    console.error("Error formatting material checklist:", error);
    return { error: "Error formatting material checklist" };
  }
};

const printMaterialChecklist = async (checklistId, checklist) => {
  try {
    const materialChecklist = await MaterialChecklist.findById(checklistId)
      .populate("car")
      .populate("user");

    const filename =
      "checklist_inf-" +
      materialChecklist.user.username +
      "-" +
      materialChecklist.car.name +
      "-" +
      materialChecklist.created_at
        .toLocaleDateString("it-IT")
        .replace(/\//g, "-") +
      "-" +
      materialChecklist.created_at.toLocaleTimeString("it-IT") +
      ".pdf";

    // Launch a browser instance
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    // Read the HTML template
    const htmlContent = fs.readFileSync(
      `${process.cwd()}/src/html/material_page.html`,
      "utf-8"
    );

    // Inject the checklist data into the template
    let newContent = htmlContent.replace(
      "</head>",
      `<script>const checklist = ${JSON.stringify(checklist)};</script></head>`
    );

    await page.setContent(newContent, { waitUntil: "networkidle0" });

    // Generate PDF
    await page.pdf({
      path: `/var/data/${filename}`,
      format: "A4",
      scale: 0.8,
      printBackground: true,
    });

    // Close the browser
    await browser.close();

    return {
      statusCode: 200,
      message: "PDF generated successfully",
      filename: filename,
    };
  } catch (error) {
    console.error("Error generating material checklist PDF:", error);
    return { statusCode: 500, message: "Error generating PDF" };
  }
};

const findPDF = async (request, reply) => {
  const { checklistId } = request;
  const carChecklist = await CarChecklist.findById(checklistId)
    .populate("car")
    .populate("user");
  const materialChecklist = await MaterialChecklist.findById(checklistId)
    .populate("car")
    .populate("user");

  if (carChecklist) {
    const filePath = `/var/data/checklist-${carChecklist.user.username}-${
      carChecklist.car.name
    }-${carChecklist.created_at
      .toLocaleDateString("it-IT")
      .replace(/\//g, "-")}-${carChecklist.created_at.toLocaleTimeString(
      "it-IT"
    )}.pdf`;
    const fileStream = fs.readFileSync(filePath);
    // download the PDF
    reply.header("Content-Type", "application/pdf");
    reply.header(
      "Content-Disposition",
      `attachment; filename=${filePath.split("/").pop()}`
    );
    reply.send(fileStream);
  } else if (materialChecklist) {
    const filePath = `/var/data/checklist_inf-${
      materialChecklist.user.username
    }-${materialChecklist.car.name}-${materialChecklist.created_at
      .toLocaleDateString("it-IT")
      .replace(/\//g, "-")}-${materialChecklist.created_at.toLocaleTimeString(
      "it-IT"
    )}.pdf`;
    const fileStream = fs.readFileSync(filePath);
    // download the PDF
    reply.header("Content-Type", "application/pdf");
    reply.header(
      "Content-Disposition",
      `attachment; filename=${filePath.split("/").pop()}`
    );
    reply.send(fileStream);
  } else {
    return {
      statusCode: 404,
      message: "Checklist not found",
    };
  }
};

const getPdfForChecklist = async (request, reply) => {
  try {
    const { id } = request.params;

    // Check if it's a car checklist
    let checklist = await CarChecklist.findById(id);
    let isCarChecklist = true;

    if (!checklist) {
      // If not found, check if it's a material checklist
      checklist = await getMaterialChecklist(id);
      isCarChecklist = false;

      if (!checklist) {
        return reply.code(404).send({
          message: "Checklist not found",
        });
      }
    }

    // Construct filename based on checklist type
    const checklistDate = new Date(checklist.created_at);
    const formattedDate = checklistDate
      .toLocaleDateString("it-IT")
      .replace(/\//g, "-");

    let fileName;
    if (isCarChecklist) {
      fileName = `checklist_${checklist.user.firstName}_${checklist.user.lastName}_${checklist.car.name}_${formattedDate}.pdf`;
    } else {
      fileName = `material_checklist_${checklist.user.firstName}_${checklist.user.lastName}_${checklist.car.name}_${formattedDate}.pdf`;
    }

    const filePath = path.join(__dirname, "../pdf", fileName);

    // Check if the file exists
    if (fs.existsSync(filePath)) {
      reply.header("Content-Type", "application/pdf");
      reply.header("Content-Disposition", `attachment; filename=${fileName}`);
      const fileStream = fs.createReadStream(filePath);
      return reply.send(fileStream);
    } else {
      return reply.code(404).send({
        message: "PDF file not found",
      });
    }
  } catch (error) {
    console.error("Error fetching PDF:", error);
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
