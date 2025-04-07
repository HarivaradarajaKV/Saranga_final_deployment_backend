const router = require('express').Router();
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
        return res.status(500).json({
            reviews: [],
            average_rating: 0,
            review_count: 0,
            error: 'Failed to fetch brand reviews',
            details: error.message
        });
    }
});

// Add a brand review
router.post('/', auth, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const user_id = req.user.id;

        // Check if user has already reviewed
        const existingReview = await pool.query(
            'SELECT * FROM brand_reviews WHERE user_id = $1',
            [user_id]
        );

        if (existingReview.rows.length > 0) {
            return res.status(400).json({ error: 'You have already submitted a brand review' });
        }

        // Add the review
        const newReview = await pool.query(
            'INSERT INTO brand_reviews (user_id, rating, comment) VALUES ($1, $2, $3) RETURNING *',
            [user_id, rating, comment]
        );

        // Get user details for the response
        const user = await pool.query(
            'SELECT name, COALESCE(avatar_url, \'\') as avatar_url FROM users WHERE id = $1',
            [user_id]
        );
        
        const reviewWithUserDetails = {
            ...newReview.rows[0],
            user_name: user.rows[0].name,
            avatar_url: user.rows[0].avatar_url || ''
        };

        res.json(reviewWithUserDetails);
    } catch (error) {
        console.error('Error in POST /brand-reviews:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update a brand review
router.put('/', auth, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const user_id = req.user.id;

        // Check if review exists
        const existingReview = await pool.query(
            'SELECT * FROM brand_reviews WHERE user_id = $1',
            [user_id]
        );

        if (existingReview.rows.length === 0) {
            return res.status(404).json({ error: 'Review not found' });
        }

        // Update the review
        const updatedReview = await pool.query(
            'UPDATE brand_reviews SET rating = $1, comment = $2 WHERE user_id = $3 RETURNING *',
            [rating, comment, user_id]
        );

        // Get user details for the response
        const user = await pool.query('SELECT name, avatar_url FROM users WHERE id = $1', [user_id]);
        
        const reviewWithUserDetails = {
            ...updatedReview.rows[0],
            user_name: user.rows[0].name,
            avatar_url: user.rows[0].avatar_url
        };

        res.json(reviewWithUserDetails);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a brand review
router.delete('/:reviewId', auth, async (req, res) => {
    try {
        const user_id = req.user.id;
        const review_id = req.params.reviewId;

        // First check if the review exists and belongs to the user
        const checkResult = await pool.query(
            'SELECT * FROM brand_reviews WHERE id = $1 AND user_id = $2',
            [review_id, user_id]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Review not found or you do not have permission to delete it' });
        }

        // Delete the review
        const result = await pool.query(
            'DELETE FROM brand_reviews WHERE id = $1 AND user_id = $2 RETURNING *',
            [review_id, user_id]
        );

        res.json({ message: 'Review deleted successfully', review: result.rows[0] });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ error: 'Failed to delete review' });
    }
});

module.exports = router; 