import net from "net";
import fs from "fs";
import path from "path";

export const isPortTaken = (port) => {
  return new Promise((resolve, reject) => {
    const tester = net
      .createServer()
      .once("error", function (err) {
        if (err.code !== "EADDRINUSE") return reject(err);
        resolve(true);
      })
      .once("listening", function () {
        tester
          .once("close", function () {
            resolve(false);
          })
          .close();
      })
      .listen(port);
  });
};

/*
 * Walks up a directory until a file is found.
 * @return path - the path where the fileName is found
 */
export const findFile = (fileName) => {
  for (
    let curDir = process.cwd();
    curDir !== "/";
    curDir = path.resolve(curDir, "..")
  ) {
    const filepath = path.join(curDir, fileName);
    if (fs.existsSync(filepath)) {
      return filepath;
    }
  }
  return "";
};
