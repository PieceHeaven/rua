module.exports = (app) => {
  const Router = require('koa-router')
  const categoryMode = require('../model/category')
  const foodModel = require('../model/foodsDetail')
  const multer = require('koa-multer')
  const fs = require('fs')
  fs.exists('uploads', exists => {
    exists ? null : fs.mkdir('uploads', () => {})
  })
  var storage = multer.diskStorage({
    //文件保存路径
    destination: function (req, file, cb) {
      cb(null, 'uploads')
    },
    //修改文件名称
    filename: function (req, file, cb) {

      if (file) {
        var fileFormat = (file.originalname).split("."); //以点分割成数组，数组的最后一项就是后缀名
        cb(null, Date.now() + "." + fileFormat[fileFormat.length - 1]);
      } else {
        cb(null, false);
      }

    }
  })
  //加载配置
  let upload = multer({
    storage: storage
  });
  const category = new Router({
    prefix: '/category'
  })
  category.get('/list', async ctx => {
    let {
      pageNum
    } = ctx.query

    if (pageNum != undefined) {
      //分页查询
      let res = await new Promise((reslove, reject) => {
        categoryMode.countDocuments({}, (err, count) => {
          let page = Math.ceil(count / 7)
          if (pageNum > page) {
            reslove({
              is: false
            })
          } else {
            categoryMode.find().skip((pageNum - 1) * 7).limit(7).exec((err, doc) => {
              reslove({
                is: true,
                doc,
                allLength: count
              })
            })
          }
        })
      })
      const {
        is,
        doc,
        allLength
      } = res
      is ? ctx.body = {
        code: 0,
        msg: '查询成功',
        data: {
          arr: doc,
          allLength,
          msg: '查询成功'
        }
      } : ctx.body = {
        code: -1,
        msg: '获取失败'
      }

    } else {
      let arr = await categoryMode.find()
      ctx.body = {
        data: arr,
        code: 0
      }
    }

  })
  category.get('/detail', async ctx => {
    const {
      id
    } = ctx.query
    const result = await categoryMode.findById(id)
    ctx.body = {
      code: 0,
      data: result,
      msg: '获取分类信息成功'
    }
  })
  category.post('/create', upload.single('icon'), async ctx => {
    if(!ctx.req.file.filename){
      ctx.body = {
        code: -1,
        msg: 'File not found, please upload your category picture.'
      }
      return;
    }
    let res = await createCategory(ctx.req.body.name, ctx.req.file.filename, ctx.req.body.showInIndex, ctx.req.body.isPopular)
    if (res == '添加失败') {
      ctx.body = {
        code: -1,
        msg: '添加失败,不能添加相同的名称'
      }
    } else {
      ctx.body = {
        code: 0,
        msg: '添加成功'
      }
    }
  })
  category.post('/update', upload.single('icon'), async ctx => {
    //更新分类
    const {
      id,
      name,
      oldImg,
      isPopular,
      showInIndex
    } = ctx.req.body
    console.log(id, name, oldImg, isPopular, showInIndex)
    await categoryMode.findByIdAndUpdate(id, {
      categoryName: name,
      categoryIcon:oldImg!=undefined?oldImg:ctx.req.file.filename,
      isPopular,
      showInIndex
    })
     ctx.body = {
       code:0,
       msg:"修改成功"
     }
  })
  category.post('/remove', async ctx => {
    //如果当前分类上有商品,不允许删除分类
    const {
      id
    } = ctx.request.body
    let arr = foodModel.find({
      foodsCategory:id
    })
    if(arr.length==0){
      //允许删除
      await categoryMode.findByIdAndRemove(id)
      ctx.body = {
        code: 0,
        msg: '删除成功'
      }
    }else{
      ctx.body = {
        code:-1,
        msg:'当前分类有内容,无法删除'
      }
    }

  })

  function createCategory(name, icon, showInIndex, isPopular) {
    return new Promise((reslove, reject) => {
      categoryMode.create({
        categoryName: name,
        categoryIcon: icon,
        showInIndex,
        isPopular
      }, function (err) {
        if (!err) {
          reslove('添加成功')
        } else {
          reslove('添加失败')
        }
      })
    })
  }
  app.use(category.routes()).use(category.allowedMethods())
}