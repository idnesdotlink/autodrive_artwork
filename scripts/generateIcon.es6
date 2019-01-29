import path from 'path'
import fs from 'fs'
import yaml from 'js-yaml'
import {each, map} from 'lodash'
import svg2png from 'svg2png'
import {promisify} from 'bluebird'
import mkdirp from 'mkdirp'

import imagemin from 'imagemin'
const imageminOptipng = require('imagemin-optipng')

const readdir = promisify(fs.readdir)
const stat = promisify(fs.stat)
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const mkdirpSync = promisify(mkdirp)

const pathRoot = path.resolve('.')
const srcPath = path.join(pathRoot, 'src')
const distPath = path.join(pathRoot, 'dist')

let walkSync = async function (dir, filelist) {
  let files = await readdir(dir);
  filelist = filelist || []; 
  each(
    files,
    async function (file) {
      let pathToFile = path.join(dir, file)
      let fileStat = await stat(pathToFile)
      if (fileStat.isDirectory()) walkSync(pathToFile, filelist)
      else if (path.extname(file) === '.yml') {
        let pathToDir = path.dirname(pathToFile)
        let dirname = pathToDir.split(path.sep).pop()
        let data = await readFile(pathToFile, 'utf8')
        data = yaml.safeLoad(data)
        let {name, source, output} = data
        source = path.join(pathToDir, source)
        source = await readFile(source)
        each(output.target, async function (target) {
          let width = target.size.width ? target.size.width : target.size
          let height = target.size.height ? target.size.height : target.size
          let buffer = await svg2png(source, { width, height })
          try {
          buffer = await imagemin.buffer(buffer, {use: [imageminOptipng()]})
          } catch(e) {
            console.log(e)
          }
          let dir = path.join(distPath, dirname, target.directory)
          await mkdirpSync(dir)
          await writeFile(path.join(dir, `${name}.png`), buffer)
        })
      }
    }
  );
}

function xt(x) {
  let fl = [];
  walkSync(x, fl)
  return fl;
}

xt(srcPath);