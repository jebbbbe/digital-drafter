# problem

three.js instanced attribute with meshPerAttribute

instanceCount = 8
attribute1.meshPerAttribute = 4
attribute1.count = 2
attribute2.meshPerAttribute = 1
attribute1.count = 4

| attribute1 | attribute2 |
| ----------- | ----------- |
| 1           | 1           |
| 1           | 2           |
| 1           | 3           |
| 1           | 4           |
| 2           | 1           |
| 2           | 2           |
| 2           | 3           |
| 2           | 4           |

i think this produces this: 

| attribute1 | attribute2 |
| ----------- | ----------- |
| 1           | 1           |
| 1           | 2           |
| 1           | 3           |
| 1           | 4           |
| 2           |             |
| 2           |             |
| 2           |             |
| 2           |             |