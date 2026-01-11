const express = require('express');
const router = express.Router();
const { saveRoute, getSavedRoutes, deleteRoute } = require('../controllers/routeController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, saveRoute); // POST /api/routes
router.get('/', authMiddleware, getSavedRoutes); // GET /api/routes
router.delete('/:id', authMiddleware, deleteRoute); // DELETE /api/routes/:id

module.exports = router;
