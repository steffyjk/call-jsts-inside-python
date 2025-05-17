"use strict";
const userName = process.argv[2] || "world";
let count = 0;
const interval = setInterval(() => {
    count++;
    const response = {
        second: count,
        message: `hello "${userName}"`
    };
    console.log(JSON.stringify(response));
    if (count >= 10) {
        clearInterval(interval);
    }
}, 1000);
