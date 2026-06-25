const getClientIP = (req) => {
    return (
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.headers['x-real-ip'] ||
        req.socket?.remoteAddress ||
        req.ip ||
        'unknown'
    );
};

module.exports = { getClientIP };
