export const logger = {
    warn(msg?, ...params) { console.log(msg, ...params) },
    error(msg?, ...params) { console.log(msg, ...params) },
    debug(msg?, ...params) { console.log(msg, ...params) },
    info(msg?, ...params) { console.log(msg, ...params) },
}