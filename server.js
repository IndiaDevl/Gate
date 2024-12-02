const express = require('express');
const axios = require('axios');
const path = require('path');
const cors = require('cors');
const PDFDocument = require('pdfkit'); // Import PDFKit for PDF generation

const app = express();
const PORT = 5100;

// Middleware
app.use(cors());
app.use(express.json()); // For parsing application/json
app.use(express.static(path.join(__dirname, 'public')));

// SAP S/4HANA OData API credentials and URL
const SAP_API_BASE_URL = 'https://my418696-api.s4hana.cloud.sap/sap/opu/odata4/sap/api_purchaseorder_2/srvd_a2x/sap/purchaseorder/0001/PurchaseOrder';
const SAP_AUTH = {
    username: 'ProductMaster',
    password: 'ProductMaster@1234567890',
};

app.get('/', async (req, res) => {
    try {
        const response = await axios.get(SAP_API_BASE_URL, { auth: SAP_AUTH });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Read (Fetch all POs)
app.get('/api/purchaseorders', async (req, res) => {
    try {
        const response = await axios.get(SAP_API_BASE_URL, { auth: SAP_AUTH });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new PO
app.post('/api/purchaseorders', async (req, res) => {
    try {
        const newPo = req.body;
        const response = await axios.post(SAP_API_BASE_URL, newPo, { auth: SAP_AUTH });
        res.json({ message: 'Purchase Order created successfully', data: response.data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update an existing PO
app.put('/api/purchaseorders/:purchaseOrder', async (req, res) => {
    const { purchaseOrder } = req.params;
    try {
        const updatedPo = req.body;
        const response = await axios.patch(`${SAP_API_BASE_URL}/${purchaseOrder}`, updatedPo, { auth: SAP_AUTH });
        res.json({ message: 'Purchase Order updated successfully', data: response.data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a PO
app.delete('/api/purchaseorders/:purchaseOrder', async (req, res) => {
    const { purchaseOrder } = req.params;
    try {
        await axios.delete(`${SAP_API_BASE_URL}/${purchaseOrder}`, { auth: SAP_AUTH });
        res.json({ message: 'Purchase Order deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Generate and download PDF for a specific PO
app.get('/api/download-pdf/:purchaseOrder', async (req, res) => {
    const { purchaseOrder } = req.params;
    try {
        const response = await axios.get(`${SAP_API_BASE_URL}/${purchaseOrder}`, { auth: SAP_AUTH });
        const poData = response.data;

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=PurchaseOrder_${purchaseOrder}.pdf`);
        doc.pipe(res);

        doc.fontSize(16).text(`Purchase Order Details - ${purchaseOrder}`, { align: 'center' });
        doc.moveDown(1);
        
        const poFields = [
            { label: 'PO Number', value: poData.PurchaseOrder },
            { label: 'PO Type', value: poData.PurchaseOrderType },
            { label: 'Supplier', value: poData.Supplier },
            { label: 'Company Code', value: poData.CompanyCode },
            { label: 'Purchasing Group', value: poData.PurchasingGroup },
            { label: 'Purchasing Organization', value: poData.PurchasingOrganization },
        ];

        poFields.forEach(field => {
            doc.fontSize(12).text(`${field.label}: ${field.value || 'N/A'}`);
            doc.moveDown(0.5);
        });

        doc.end();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
