// import
const app = require('./src/app');
const logger = require('./src/logger');

// ----------------------------------------------------------
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    logger.info(`server is running in PORT: ${PORT}`);
});
