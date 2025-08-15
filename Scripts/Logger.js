// 简化的日志工具
export class Logger {
    static formatTime() {
        const now = new Date();
        return now.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    static log(module, message, data = null) {
        const time = this.formatTime();
        if (data) console.log(`[${time}] [${module}] ${message}`, data);
        else console.log(`[${time}] [${module}] ${message}`);
    }

    static error(module, message, error = null) {
        const time = this.formatTime();
        if (error) console.error(`[${time}] [${module}] ${message}`, error.message || error);
        else console.error(`[${time}] [${module}] ${message}`);
    }

    static warn(module, message, data = null) {
        const time = this.formatTime();
        if (data) console.warn(`[${time}] [${module}] ${message}`, data);
        else console.warn(`[${time}] [${module}] ${message}`);
    }
}