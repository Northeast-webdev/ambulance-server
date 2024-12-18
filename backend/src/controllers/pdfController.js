// controllers/pdfController.js
const puppeteer = require("puppeteer");
const fs = require("fs");
const { CarChecklist } = require("../schema/carChecklist.schema");
const { MaterialChecklist } = require("../schema/materialChecklist.schema");
const { Car } = require("../schema/car.schema");

const printCarChecklist = async (request) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Fetch checklist from database or request body
  const { checklistId, checklist } = request; // Assuming you're passing the checklist ID as a query param
  const carChecklist = await CarChecklist.findById(checklistId)
    .populate("car")
    .populate("user");
  const car = await Car.findById(carChecklist.car._id.toString());
  const damages = car.damages;
  const VAN_IMAGES = {
    front: fs.readFileSync(`${process.cwd()}/backend/img/van/front.png`),
    back: fs.readFileSync(`${process.cwd()}/backend/img/van/back.png`),
    left: fs.readFileSync(`${process.cwd()}/backend/img/van/left.png`),
    right: fs.readFileSync(`${process.cwd()}/backend/img/van/right.png`),
  };
  const filename =
    "checklist-" +
    carChecklist.user.username +
    "-" +
    carChecklist.car.name +
    "-" +
    carChecklist.created_at.toLocaleDateString("it-IT") +
    "-" +
    carChecklist.created_at.toLocaleTimeString("it-IT");
  const logo = fs
    .readFileSync(`${process.cwd()}/backend/img/logo.png`)
    .toString("base64");
  const labels = {
    luciPosizioneAnteriori: "Luci posizione anteriori",
    anabbaglianti: "Anabbaglianti",
    abbaglianti: "Abbaglianti",
    fendinebbia: "Fendinebbia",
    frecceAnteriori: "Frecce anteriori",
    luciPosizionePosteriori: "Luci posizione posteriori",
    luciStop: "Luci stop",
    luciRetromarcia: "Luci retromarcia",
    retronebbia: "Retronebbia",
    freccePosteriori: "Frecce posteriori",
    luceTarga: "Luce targa",
    lampeggianti: "Lampeggianti",
    strobo: "Strobo",
    fariAusiliari: "Fari ausiliari",
    sirene: "Sirene (no dopo le ore 22)",
    triangoloEmergenza: "Triangolo emergenza",
    torcia: "Torcia",
    kitSostituzionePneumatico: "Kit sostituzione pneumatico",
    kitAntiscasso: "Kit antiscasso",
    ruotaDiScorta: "Ruota di scorta",
    cateneDaNeve: "Catene da neve",
    documentiNecessari: "Documenti necessari",
  };
  // Generate table rows based on the checklist object
  const checklistRows = Object.entries(checklist)
    .map(([key, value]) => {
      const status = value ? "✔" : "✘";
      return `
        <tr>
          <td>${labels[key]}</td>
          <td>${status}</td>
        </tr>`;
    })
    .join("");

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
            </tr>
        </thead>
        <tbody>
        <tr>
          <td>Nome</td>
          <td>${carChecklist.car.name}</td>
        </tr>
        <tr>
          <td>Marca</td>
          <td>${carChecklist.car.meta.brand}</td>
        </tr>
        <tr>
          <td>Modello</td>
          <td>${carChecklist.car.meta.model}</td>
        </tr>
        <tr>
          <td>Targa</td>
          <td>${carChecklist.car.meta.plate_number}</td>
        </tr>
        <tr>
          <td>Autista</td>
          <td>${carChecklist.user.first_name} ${carChecklist.user.last_name
    }</td>
        </tr>
        <tr>
          <td>Inizio turno</td>
          <td>${carChecklist.car.shift_start.toLocaleDateString("it-IT") +
    " " +
    carChecklist.car.shift_start.toLocaleTimeString("it-IT")
    }</td>
        </tr>
        <tr>
          <td>Chilometri</td>
          <td>${carChecklist.car.meta.kilometers}km</td>
        </tr>
        <tr>
          <td>Livello carburante</td>
          <td>${carChecklist.car.meta.carbon_level}%</td>
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
    path: `/var/data/pdf/${filename}.pdf`,
    format: "A4",
    scale: 0.8,
    printBackground: true,
  });
  await browser.close();

  return {
    statusCode: 200,
    filename: filename,
  };
};

const printMaterialChecklist = async (request) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const { checklist, id } = request;

  // Fetch checklist from database or request body
  const materialChecklist = await MaterialChecklist.findById(id)
    .populate("user")
    .populate("car");
  const filename =
    "checklist_inf-" +
    materialChecklist.user.username +
    "-" +
    materialChecklist.car.name +
    "-" +
    materialChecklist.created_at.toLocaleDateString("it-IT") +
    "-" +
    materialChecklist.created_at.toLocaleTimeString("it-IT");

  // Read both HTML files
  const htmlContent = fs.readFileSync(
    `${process.cwd()}/backend/src/html/material_page.html`,
    "utf-8"
  );

  let newContent = htmlContent.replace(
    "</head>",
    `<script>${checklist
      ? `const checklist = ${JSON.stringify(checklist)};`
      : fs.readFileSync(`${process.cwd()}/backend/src/html/test.js`, "utf-8")
    }</script></head>`
  );

  await page.setContent(newContent, { waitUntil: "networkidle0" });

  await page.pdf({
    path:
      process.env.NODE_ENV === "production"
        ? `/var/data/pdf/${filename}.pdf`
        : `${process.cwd()}/backend/pdf/test.pdf`,
    format: "A4",
    scale: 0.8,
    printBackground: true,
  });
  await browser.close();

  return {
    statusCode: 200,
    filename: filename,
  };
};

const findPDF = async (request, reply) => {
  const { checklistId } = request;
  const carChecklist = await CarChecklist.findById(checklistId)
    .populate("car")
    .populate("user");
  const materialChecklist = await MaterialChecklist.findById(
    checklistId
  ).populate("car");

  if (carChecklist) {
    const filePath = `/var/data/pdf/checklist-${carChecklist.user.username}-${carChecklist.car.name}-${carChecklist.created_at.toLocaleDateString("it-IT")}-${carChecklist.created_at.toLocaleTimeString("it-IT")}.pdf`;
    const fileStream = fs.readFileSync(filePath);
    // download the PDF
    reply.header("Content-Type", "application/pdf");
    reply.header(
      "Content-Disposition",
      `attachment; filename=${filePath.split("/").pop()}`
    );
    reply.send(fileStream);
  } else if (materialChecklist) {
    const filePath = `/var/data/pdf/checklist_inf-${materialChecklist.user.username}-${materialChecklist.car.name}-${materialChecklist.created_at.toLocaleDateString("it-IT")}-${materialChecklist.created_at.toLocaleTimeString("it-IT")}.pdf`;
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

module.exports = { printCarChecklist, printMaterialChecklist, findPDF };
