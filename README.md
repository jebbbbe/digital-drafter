# todo

### other

- [ ] save and load
- [ ] electron
- [ ] drawable intersection shape
- [ ] svg/dwg export
- [ ] draw on mesh
- [ ] mesh upload
- [ ] mesh draw
- [ ] CDN
- [ ] auth
- [ ] payment?

### v0.5.0

- [s] perf compare batched mesh? update geo...?
- [ ] do update range at the end of recursive by keeping track of dirty locations.
- [ ] recursive function only calc compundMatrix, not baseMatrix as well
- [ ] see if notes on matrix prefix can be used here?
- [ ] dynamic draw usage
- [ ] boolean BVH

### v0.4.0

- INTERFACE
	- [ ] InstancedLineMaterial
	- [ ] dataTexture wip finish...
	- [ ] amtearil/setting default reads
	- [ ] lineweight in shader, with dash, etc..
	- [ ] materail resolution tracker, use world space size for lw..?
	- [ ] small lineweight rasterize...?
	- [ ] Profile Edge Depthmap Read..?
	- [ ] gl lines -> normal materail with wireframe?

- [ ] organize
	- [ ] more classes, import structure
	- [ ] attachment update lyfecycle
	- [ ] scale prop on node for datatexture
	- [ ] class for interaciotn modes to easily add more
	- [ ] select multiple, gizmo + position ref 
	- [ ] gizmo offset
	- [ ] interseciton logic

- [ ] select multiple
    - [ ] window select multiple
    - [ ] transform controls - gizmo origin from multiple selects
	
- [ ] Interface
    - [x] rm react dynamic import, use module splitting
    - [ ] transform controls- leva proxy link
    - [ ] better theme loader, with functions
    - [ ] three/react - import/returns?
- [ ] todo
    - [ ] switch to OOP for ISntance Item and Node? to many imports/util fns.
    - [ ] interacction classes..?
    - [ ] diff based move for gizmo..?

- [x] section cut
    - [x] transform controls- fix scale
    - [x] transform controls, pass to moveObject
    - [x] move attachments direcly to node
    - [x] move all specal move fns to dfs
        - [d] select color on line
        - [x] move node attachments with a vec3 Diff
        - [x] put face geometry in attachments
        - [x] attachments class
        - [w] move section constrain
        - [x] move line constrain
        - [x] update section on move
        - [x] delete segment
        - [x] delete section
        - [x] descendants
        - [x] detach
        - [x] bvh section lineweight, evaluator.debug.edges
        - [x] section cut geometry

- [w] initial transform storage\*
- [w] parent/child relationship
- [x] selected glitch
- [x] escape key deselect

### v0.3.0

- [x] undo git squash
- [x] mobile css
- [x] keyboard events
- [x] section cut fix
- [x] parent offset transform, geometry center transform
- [x] new ui layout
- [x] add new geometry
- [x] selection manager.
- [x] color change in UI
- [x] bvh section cleanup..
- [x] section cut bvh
- [x] fold line geo
- [x] global data texture
- [x] perf monitor
- [x] render doc injection
- [s] how to deal with recursive children in diff buckets...?
- [x] prune/ add node buttons
- [x] rot/scale root
- [x] pointerDown mobile disable multi touch points.
- [x] interactive root controls.

### v0.2.0

- [s] pref compare instance v non instanced lw material in threetools
- [s] instantiable screenspace lineweight material
- [x] instantiable lineweight material
- [x] vercel deployment
- [x] dashed lines
- [x] themes
- [x] themed gizmo

### v0.1.0

- [/] addLeafNode, take in parents node
- [x] move matrix on mouse click

# three.js contrib

- finish matrix2 implementation
- generic line Instance Material
- example comparing all line materials with notes
- lines addons dont use instance matrix correctly
- all line addons are already instanced, they are correct :(

# line2

https://github.com/WestLangley
https://discourse.threejs.org/t/setdrawrange-on-three-line2/2891
https://stackoverflow.com/questions/31399856/drawing-a-line-with-three-js-dynamically/31411794#31411794
https://blog.fastforwardlabs.com/2017/10/04/first-look-using-three.js-for-2d-data-visualization.html

# \*

before continuing with section cut logic, there a a few crucial issues:

- how initial transform is set on root nodes
- pos offset from parent in xyz, works for section, but gizmo placement is wrong, will need for boolean logic later
- how to deal with both transform issue in TransoformNode type
- add a arent/ child relationship type in TransoformNode
    - rotate, normal rotation
    - mirror, flip UP axis in rotate
    - arc, rotate entire node, will need additional geometry
    - slide, constrain node pos to current Line position
    - section, section cut
    - boolean, bool fns
- this will let us get specific updates, allow dsf search for specific changes
- when doing dfs, switch how base, compound matrix is calc'd
