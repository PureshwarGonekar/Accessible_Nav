const { pool } = require('../config/db');

// --- Trust Score Algorithm ---
// Final Confidence = (Reports × 0.3) + (Photos × 0.2) + (User Trust × 0.2) + (Time × 0.2) + (City Match × 0.3)
// For now, we simplify:
// - Each confirming vote increases score (capped influence)
// - Photos increase score
// - Freshness is handled by filtering out old reports or decaying score (decay reserved for future)
// Start score is 0.5. Photo adds 0.2. User trust adds weighted value.

const calculateTrustScore = (report, userTrust = 0.5) => {
    let score = 0.3; // Base score

    // User Trust Influence (0.2 weight)
    score += (userTrust * 0.2);

    // Photo Influence (0.2 weight)
    if (report.photo_url) {
        score += 0.2;
    }

    // Initial assumes 1 report, so 0.3 weight * 1 (normalized for single report 1.0) -> let's say 0.1 per report up to 3
    // We already counted the creator.

    return Math.min(score, 1.0);
};

const getReports = async (req, res) => {
    try {
        // Fetch active reports
        // If we had viewport bounds in req.query, we would filter here.
        // For now, fetch recent 100 active reports.
        const query = `
            SELECT r.*, u.name as reporter_name 
            FROM reports r 
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.status = 'active'
            ORDER BY r.created_at DESC 
            LIMIT 100
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching reports:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

const createReport = async (req, res) => {
    const { type, message, location_lat, location_lng, photo_url, expected_duration, affects_wheelchair } = req.body;
    const userId = req.user ? req.user.id : null; // Assumes authMiddleware sets req.user

    try {
        // 1. Get user trust rating
        let userTrust = 0.5;
        if (userId) {
            const userRes = await pool.query('SELECT trust_rating FROM users WHERE id = $1', [userId]);
            if (userRes.rows.length > 0) userTrust = userRes.rows[0].trust_rating;
        }

        // 2. Calculate Initial Score
        const initialScore = calculateTrustScore({ photo_url }, userTrust);

        // 3. Insert Report
        const insertQuery = `
            INSERT INTO reports 
            (user_id, type, message, location_lat, location_lng, photo_url, expected_duration, affects_wheelchair, trust_score)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `;
        const values = [userId, type, message, location_lat, location_lng, photo_url, expected_duration, affects_wheelchair, initialScore];
        const newReport = await pool.query(insertQuery, values);

        const report = newReport.rows[0];

        // 4. Broadcast via WebSocket
        // We need access to the io instance. We can attach it to req in server.js or import a singleton.
        // For simplicity, let's assume req.app.get('io') works if we set it up.
        const io = req.app.get('io');
        if (io) {
            io.emit('new_report', report);
        }

        res.status(201).json(report);

    } catch (err) {
        console.error('Error creating report:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

const validateReport = async (req, res) => {
    const reportId = req.params.id;
    const { vote } = req.body; // 'confirm' or 'deny'
    const userId = req.user ? req.user.id : null;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    try {
        // 1. Record Vote
        // Check if already voted
        const checkVote = await pool.query('SELECT * FROM validations WHERE report_id = $1 AND user_id = $2', [reportId, userId]);
        if (checkVote.rows.length > 0) {
            return res.status(400).json({ message: 'You have already voted on this report.' });
        }

        await pool.query('INSERT INTO validations (report_id, user_id, vote) VALUES ($1, $2, $3)', [reportId, userId, vote]);

        // 2. Recalculate Trust Score
        // Fetch current score and update based on vote
        // Simple logic: Confirm = +0.1, Deny = -0.2
        const adjustment = vote === 'confirm' ? 0.1 : -0.2;

        const updateQuery = `
            UPDATE reports 
            SET trust_score = LEAST(GREATEST(trust_score + $1, 0), 1.0)
            WHERE id = $2
            RETURNING *
        `;
        const updatedReportRes = await pool.query(updateQuery, [adjustment, reportId]);
        const updatedReport = updatedReportRes.rows[0];

        // 3. Check for auto-resolve or auto-hide
        if (updatedReport.trust_score < 0.2) {
            await pool.query("UPDATE reports SET status = 'false_report' WHERE id = $1", [reportId]);
            updatedReport.status = 'false_report';
        }

        // 4. Identify user trust impact (future: update reporter's trust rating if confirmed by many)

        // 5. Broadcast Update
        const io = req.app.get('io');
        if (io) {
            io.emit('update_report', updatedReport);
        }

        res.json(updatedReport);

    } catch (err) {
        console.error('Error validating report:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getReports,
    createReport,
    validateReport
};
