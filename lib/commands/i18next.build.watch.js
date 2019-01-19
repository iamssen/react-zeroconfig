"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const path_1 = __importDefault(require("path"));
const getCurrentTime_1 = __importDefault(require("../getCurrentTime"));
const watchTranslation_1 = __importDefault(require("../watchTranslation"));
module.exports = function ({ appDirectory }) {
    watchTranslation_1.default({
        appDirectory: appDirectory,
        outputPath: path_1.default.join(appDirectory, 'src/generated/locales.json'),
        type: 'i18next',
    }).subscribe(() => {
        console.log(`[${getCurrentTime_1.default()}] 👍 Translation build is successful.`);
    }, error => {
        console.error(`[${getCurrentTime_1.default()}] 💀 Translation build is failed.`);
        console.error(error);
    });
};
//# sourceMappingURL=i18next.build.watch.js.map