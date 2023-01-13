# Architecture Design

## Abstract Design

- Map: is the interface layer for the user to interact with the map, providing the interface to change the view.
- Camera: maintains the camera state and is used to obtain the View-Projection transformation matrix in the current state.
- Projection: used to convert WGS84 coordinates into the required coordinate space, such as Web Mercator plane coordinates; this process is actually equivalent to Model in MVP, except that it is performed in the CPU.
- Layer: to get the standard StructuredData from Source and give it to Render to render according to business requirements.
- Source: obtains data from various standard data formats and processes it into StructuredData; processing is usually done in the web-worker.
- StructuredData: is essentially a big-buffer, but with some information attached to help Render intercept what it needs from this big-buffer.
- Render: hands off StructuredData and GLContext to a specific Program for graphical rendering.
- GLContext: WebGL's API use requires frequent switching of its internal state; GLContext is a wrapper around these operations, which makes the process of state switching cleaner and safer.
- Program: is the encapsulation of the Shader and its defined attributes and uniforms, and since the Shader/attributes/uniforms actually determine the final look of the graphics rendering, it can be further understood that Program is the encapsulation of a specific graphics rendering.
- Shader: After this point it is pure WebGL content, no further abstraction.


Translated with www.DeepL.com/Translator (free version)