// We'll store reactions in Netlify's environment (simple approach)
// For production, consider using Netlify Forms or a simple JSON file

let reactions = []; // In-memory storage (resets on cold start)

exports.handler = async (event, context) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        // Only allow POST requests
        if (event.httpMethod !== 'POST') {
            return {
                statusCode: 405,
                headers,
                body: JSON.stringify({ error: 'Method not allowed' })
            };
        }

        // Parse request body
        const data = JSON.parse(event.body || '{}');
        const { reaction, timestamp } = data;

        // Simple validation
        if (!reaction || typeof reaction !== 'string') {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    error: 'Valid reaction text is required' 
                })
            };
        }

        // Create reaction object
        const reactionData = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            reaction: reaction.trim(),
            timestamp: timestamp || new Date().toISOString(),
            savedAt: new Date().toISOString(),
            ip: event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown'
        };

        // Store in memory array
        reactions.push(reactionData);
        
        // Log to console (Netlify will save these logs)
        console.log('New reaction saved:', {
            id: reactionData.id,
            timestamp: reactionData.timestamp,
            reactionLength: reactionData.reaction.length,
            ip: reactionData.ip
        });

        // Keep only last 1000 reactions to prevent memory issues
        if (reactions.length > 1000) {
            reactions = reactions.slice(-1000);
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true, 
                message: 'Reaction saved successfully',
                id: reactionData.id
            })
        };

    } catch (error) {
        console.error('Error saving reaction:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                error: 'Failed to save reaction',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            })
        };
    }
};

// Alternative: Netlify Forms approach (uncomment if you want to use Netlify Forms)
/*
// In your HTML form:
<form name="reactions" netlify netlify-honeypot="bot-field" hidden>
  <input type="text" name="reaction" />
  <input type="text" name="timestamp" />
  <input type="text" name="userAgent" />
</form>

// Then in JavaScript:
async function saveReaction(text) {
    const formData = new FormData();
    formData.append('form-name', 'reactions');
    formData.append('reaction', text);
    formData.append('timestamp', new Date().toISOString());
    formData.append('userAgent', navigator.userAgent);
    
    try {
        await fetch('/', {
            method: 'POST',
            body: formData
        });
        console.log('Reaction saved via Netlify Forms');
    } catch (error) {
        console.error('Error saving reaction:', error);
    }
}
*/
