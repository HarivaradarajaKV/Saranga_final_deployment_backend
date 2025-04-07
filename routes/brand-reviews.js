const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth } = require('../middleware/auth');

// Get all brand reviews
router.get('/', async (req, res) => {
    try {
        // Check if brand_reviews table exists
        const { rows: [{ exists: tableExists }] } = await pool.query(`
            SELECT EXISTS (
                SELECT 1 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                AND table_name = 'brand_reviews'
            );
        `);

        if (!tableExists) {
            return res.json({
                reviews: [],
                average_rating: 0,
                review_count: 0,
                message: 'Brand reviews table does not exist yet'
            });
        }

        // Get reviews with user names in a single query
        const { rows } = await pool.query(`
            WITH review_stats AS (
                SELECT 
                    COALESCE(AVG(rating)::numeric(10,1), 0) as average_rating,
                    COUNT(*) as review_count
                FROM brand_reviews
            )
            SELECT 
                br.id,
                br.user_id,
                br.rating,
                br.comment,
                br.created_at,
                COALESCE(u.name, 'Anonymous') as user_name,
                rs.average_rating,
                rs.review_count
            FROM brand_reviews br
            LEFT JOIN users u ON br.user_id = u.id
            CROSS JOIN review_stats rs
            ORDER BY br.created_at DESC;
        `);

        // Format the response with consistent structure
        const formattedResponse = {
            reviews: rows.map(review => ({
                id: review.id,
                user_id: review.user_id,
                rating: review.rating,
                comment: review.comment,
                created_at: review.created_at,
                user_name: review.user_name,
                avatar_url: 'https://via.placeholder.com/40' // Default avatar URL
            })),
            average_rating: rows.length > 0 ? parseFloat(rows[0].average_rating) || 0 : 0,
            review_count: rows.length > 0 ? parseInt(rows[0].review_count) || 0 : 0
        };

        return res.json(formattedResponse);

    } catch (error) {
        console.error('Error in GET /brand-reviews:', error);
        // Send a proper error response
        return res.status(500).json({
            reviews: [],
            average_rating: 0,
            review_count: 0,
            error: 'Failed to fetch brand reviews',
            details: error.message
        });
    }
});

// Add a new brand review
router.post('/', auth, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const user_id = req.user.id;

        // Check if user has already submitted a review
        const existingReview = await pool.query(
            'SELECT id FROM brand_reviews WHERE user_id = $1',
            [user_id]
        );

        if (existingReview.rows.length > 0) {
            return res.status(400).json({
                error: 'You have already submitted a brand review'
            });
        }

        const { rows: [review] } = await pool.query(`
            INSERT INTO brand_reviews (user_id, rating, comment)
            VALUES ($1, $2, $3)
            RETURNING *;
        `, [user_id, rating, comment]);

        // Get user name
        const { rows: [user] } = await pool.query(
            'SELECT name FROM users WHERE id = $1',
            [user_id]
        );

        const reviewWithUserDetails = {
            ...review,
            user_name: user?.name || 'Anonymous'
        };

        res.status(201).json(reviewWithUserDetails);
    } catch (error) {
        console.error('Error adding brand review:', error);
        res.status(500).json({
            error: 'Failed to add brand review',
            details: error.message
        });
    }
});

// Update a brand review
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;

        const query = `
            UPDATE brand_reviews
            SET rating = $1, comment = $2
            WHERE id = $3
            RETURNING *;
        `;

        const { rows } = await pool.query(query, [rating, comment, id]);
        
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Brand review not found'
            });
        }

        // Get user name for the response
        const user = await pool.query('SELECT name FROM users WHERE id = $1', [rows[0].user_id]);
        
        const reviewWithUserDetails = {
            ...rows[0],
            user_name: user.rows[0].name
        };

        res.json(reviewWithUserDetails);
    } catch (error) {
        console.error('Error updating brand review:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update brand review',
            details: error.message
        });
    }
});

// Delete a brand review
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            DELETE FROM brand_reviews
            WHERE id = $1
            RETURNING *;
        `;

        const { rows } = await pool.query(query, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Brand review not found'
            });
        }

        res.json({ success: true, message: 'Brand review deleted successfully' });
    } catch (error) {
        console.error('Error deleting brand review:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete brand review',
            details: error.message
        });
    }
});

module.exports = router; 