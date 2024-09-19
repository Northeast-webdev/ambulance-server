// controllers/pdfController.js

const puppeteer = require("puppeteer");
const fs = require("fs");
const { fastify } = require("../init");

const printPDF = async (request, reply) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const title = request.query.title || "My PDF";
  const content = request.query.content || "My PDF content";
  let filename = request.query.filename || "output";
  if (filename === "timestamp") {
    filename = new Date().getTime().toString();
  }
  const logo = fs
    .readFileSync(`${process.cwd()}/backend/img/logo.png`)
    .toString("base64");
  // Set your HTML content here
  const htmlContent = `
    <html>
    <head>
        <title>${title}</title> 
    </head>
    <body>
    <table id="headerTable">
        <tr>
            <td><img src="data:image/png;base64,${logo}" alt="Logo" /></td>
            <td><h1>${title}</h1></td>
            <td>${content}</td>
        </tr>
    </table>
      <table id="mainTable">
        <thead>
            <tr>
                <th>Header 1</th>
                <th>Header 2</th>
                <th>Header 3</th>
                <th>Header 1</th>
                <th>Header 2</th>
                <th>Header 3</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Row 1, Cell 1</td>
                <td>Row 1, Cell 2</td>
                <td>Row 1, Cell 3</td>
                <td>Row 1, Cell 1</td>
                <td>Row 1, Cell 2</td>
                <td>Row 1, Cell 3</td>
            </tr>
            <tr>
                <td>Row 2, Cell 1</td>
                <td>Row 2, Cell 2</td>
                <td>Row 2, Cell 3</td>
                <td>Row 2, Cell 1</td>
                <td>Row 2, Cell 2</td>
                <td>Row 2, Cell 3</td>
            </tr>
            <tr>
                <td>Row 3, Cell 1</td>
                <td>Row 3, Cell 2</td>
                <td>Row 3, Cell 3</td>
                <td>Row 3, Cell 1</td>
                <td>Row 3, Cell 2</td>
                <td>Row 3, Cell 3</td>
            </tr>
        </tbody>
    </table>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap');
        html, body {
            box-sizing: border-box;
            }
        * {
            font-family: 'Roboto', sans-serif;
        }
        #headerTable {
            width: 100%;
            margin-bottom: 20px;
            border: 0;
            table-layout: fixed;
        }
        #headerTable h1, #headerTable td {
            margin: 0;
            text-align: center;
        }
        #headerTable img {
            width: 40px;
            height: 40px;
            object-fit: contain;
            display: block;
            margin: 0 auto;
        }
        #mainTable {
            width: 100%;
            border-collapse: collapse;
        }
        #mainTable th, #mainTable td {
            border: 1px solid black;
            padding: 8px 4px;
            text-align: center;
            font-weight: 500;
            font-size: 0.8rem;
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
    path: `${process.cwd()}/backend/pdf/${filename}.pdf`,
    format: "A4",
    printBackground: true,
  });
  await browser.close();
  // return the path to the generated PDF
  const stream = fs.readFileSync(
    `${process.cwd()}/backend/pdf/${filename}.pdf`
  );

  // download the PDF
  reply.header("Content-Type", "application/pdf");
  reply.header("Content-Disposition", `attachment; filename=${filename}.pdf`);
  reply.send(stream);
  // delete the generated PDF
  fs.rm(`pdf/${filename}.pdf`, (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });
};

const pdfRoutes = () => {
  fastify.get("/api/pdf", printPDF);
};

module.exports = pdfRoutes;
