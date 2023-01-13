# 架构设计

## 抽象设计

- Map: 是用户与地图交互的接口层，提供变更视图的接口；
- Camera: 维护相机状态，用于获取当前状态下的View-Projection变换矩阵；
- Projection: 用于将WGS84坐标转换成需要的坐标空间中，比如Web墨卡托平面坐标；这个过程其实相当于MVP中的Model，只不过是在CPU中进行的。
- Layer: 从 Source 中获取标准的 StructuredData，并根据业务需求，交给 Render 去渲染；
- Source: 从各种标准的数据格式中获取数据，并加工成 StructuredData；加工通常在 web-worker 中进行；
- StructuredData: 本质上是一个big-buffer，不过附带了一些信息，帮助 Render 从这个big-buffer中截取需要的内容；
- Render: 把 StructuredData 和 GLContext 交给特定的 Program 进行图形渲染；
- GLContext: WebGL的API使用需要频繁切换其内部状态，GLContext是对这些操作的封装，这使得状态切换的过程更简洁、更安全；
- Program: 是对 Shader 以及其定义的attributes和uniforms的封装，又因为Shader/attributes/uniforms其实就决定了图形渲染的最终样子，所以进一步可以理解成：Program是对于特定图形渲染的封装。
- Shader: 到这里之后就是纯粹的 WebGL 的内容了，不再继续抽象。
