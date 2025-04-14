import chalk from 'chalk';
import dayjs from 'dayjs';

// Define log level colors
const levelColors = {
    info: chalk.blue,
    warn: chalk.yellow,
    error: chalk.red,
    debug: chalk.gray,
};

/**
 * Logs a message to the console with timestamp and colored level.
 * @param {string} level - Log level (info, warn, error, debug)
 * @param {string} message - The log message
 * @param  {...any} optionalParams - Additional parameters
 */
function log(level, message, ...optionalParams) {
    const color = levelColors[level] || chalk.white;
    const time = dayjs().format('YYYY-MM-DD HH:mm:ss');
    console.log(color(`[${time}] [${level.toUpperCase()}] ${message}`), ...optionalParams);
}

// Export logging methods
export const logger = {
    info: (msg, ...params) => log('info', msg, ...params),
    warn: (msg, ...params) => log('warn', msg, ...params),
    error: (msg, ...params) => log('error', msg, ...params),
    debug: (msg, ...params) => log('debug', msg, ...params),
};
