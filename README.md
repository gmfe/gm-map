# gm-map地图组件
gm-map组件是基于饿了么开发的react-amap组件的再封装，使用高德地图的API，具体功能有
1. 搜索栏输入相关关键字出现tips列表，点击某一项确定位置
2. 拖动地图确定位置，在搜索栏出现相应的地址信息

## 使用前请确保安装了以下依赖
- lodash
- react-amap
- react
- classnames
- prop-types
- less

## Props
1. center (Obj),{ longitude, latitude }，初始化地图的中心位置，如果没有初始位置就不传这个属性，center**不能为null,可以是center={ longitude: null, latitude: null }，如果是这种结构，会被认为“错误”状态**。
2. mapAddress (String), 初始化地址，可不填。
3. zoom (Number), 地图显示的缩放级别，默认值是 16。
4. amapkey (String | isRequired), 加载高德 API 使用的 Key。
5. onGetLocation (Func | isRequired)，传入一个回调函数，接受的参数即是地图返回的位置信息。 参数信息：经纬度，地址。
6. inputFocusColor（String),搜索框的边框颜色。
7. warning (Bool), 值为true时，当组件的状态为**错误**时，给出一个警告。
8. placeholder (String), 设置搜索框的placeholder。

## 本地测试
**npm install**  安装依赖
**npm run build** 打包
**npm start**  打开http//:0.0.0.0:8080

## 发版流程（npm）
本项目已配置 GitHub Actions：**推送 tag（形如 `v2.1.6`）会自动触发 `npm publish`**。

### 一次性配置
在 GitHub 仓库配置 Actions Secret：

- **Key**：`NPM_TOKEN`
- **Value**：具备发布权限、且允许 bypass 2FA 的 npm token

### 日常发版步骤
1. 修改 `package.json` 的 `version`（例如改为 `2.1.6`），并提交到仓库。
2. 创建并推送 tag（tag 必须与版本号一致：`v${version}`）：

```bash
git tag v2.1.6
git push origin v2.1.6
```

3. 去 GitHub Actions 查看工作流 `Publish to npm (tag)`，执行成功即发布完成。

## 特别注意
因为高德地图实现是使用canvas，所以需要一个外层容器。使用时需要给个外层div,并给定宽高。