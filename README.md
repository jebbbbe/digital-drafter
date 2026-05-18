# todo

### other

- [ ] save and load
- [ ] electron
- [ ] drawable interection shape
- [ ] svg/dwg export
- [ ] draw on mesh
- [ ] mesh upload
- [ ] CDN
- [ ] auth
- [ ] payment?

### v0.5.0

- [ ] perf compare batched mesh? update geo...?
- [ ] do update range at the end of recusive by keeping trak of dirty locations.
- [ ] recuseive funciton only calc compundMatrix, not baseMatrix as well
- [ ] see if notes on matrix prefix can be used here?
- [ ] dynamic draw usage

### v0.4.0

- [ ] parent/child relationship
- [ ] intal transform stoarage\*
- [ ] parent offset transform, gometry center transform
- [ ] rm react dynamic import, use module spliting
- [ ] point angle snap
- [ ] escape key deselect
- [ ] boolean BVH
- [x] add new root...?
- [/] second leva panel, interactive
- [/] three.js specific imports
- [ ] moveline-> update Section.
- [ ] move cut-> update section line
- [ ] bvh section lineweight

### v0.3.0

- [ ] undo git squash
- [ ] better theme loader, with functions
- [ ] mobile css
- [ ] select color on line
- [ ] window select multiple
- [ ] selection manager.
- [x] color change in UI
- [x] bvh section cleanup..
- [x] section cut bvh
- [x] fold line geo
- [x] global data texture
- [x] perf monitor
- [x] render doc injeciton
- [s] how to deal with recursive children in diff buckets...?
- [x] prune/ add node buttons
- [x] rot/scale root
- [x] pointerDown mobile disable multi touch points.
- [x] interactive root controls.

### v0.2.0

- [s] pref compare instanve v non instanced lw material in threetools
- [s] instanceable screenspace lineweight material
- [x] instanceable lineweight material
- [x] vercel deployment
- [x] dashed lines
- [x] themes
- [x] themed gizmo

### v0.1.0

- [/] addLeafNode, take in parents node
- [x] move matrix on mouse click

# three.js contrib

- finsih matrix2 implementation
- generic line Instance Material
- example comparing all line materials with notes
- lines addons dont use instancce matrix correctly
- all line addons are already isntanced, they are correct :(

# line2

https://github.com/WestLangley
https://discourse.threejs.org/t/setdrawrange-on-three-line2/2891
https://stackoverflow.com/questions/31399856/drawing-a-line-with-three-js-dynamically/31411794#31411794
https://blog.fastforwardlabs.com/2017/10/04/first-look-using-three.js-for-2d-data-visualization.html

# \*

before continuing with section cut logic, there a a few crutal issues:

- how inital transform is set on root nodes
- pos offset from parent in xyz, works for section, but gizmo placement is wrong, will need for boolean logic later
- how to deal with both transform issue in TransoformNode type
- add a arent/ child relationship type in TransoformNode
    - rotate, normal rotation
    - mirror, flip UP axis in rotate
    - arc, rotate entire node, will need aditonal geometry
    - slide, constrain node pos to current Line position
    - section, seciton cut
    - boolean, bool fns
- this will let us get specific updates, allow dsf search for specific changes
- when doing dfs, switch how base, compund matrix is calc'd
