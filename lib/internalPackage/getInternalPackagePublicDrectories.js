"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const getInternalPackageEntry_1 = require("./getInternalPackageEntry");
async function getInternalPackagePublicDrectories({ cwd }) {
    return (await getInternalPackageEntry_1.getInternalPackageEntry({ cwd }))
        .map(packageName => path_1.default.join(cwd, 'src/_packages', packageName, 'public'))
        .filter(publicDirectory => fs_extra_1.default.pathExistsSync(publicDirectory) && fs_extra_1.default.statSync(publicDirectory).isDirectory());
}
exports.getInternalPackagePublicDrectories = getInternalPackagePublicDrectories;
//# sourceMappingURL=getInternalPackagePublicDrectories.js.map