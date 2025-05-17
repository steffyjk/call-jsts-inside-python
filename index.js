"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const greet_1 = require("./greet");
const name = process.argv[2] || "world";
console.log((0, greet_1.greet)(name));
