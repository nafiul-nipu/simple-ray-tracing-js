var scene = null;
var maxDepth = 1;
var background_color = [190/255, 210/255, 215/255];
var ambientToggle = true;
var diffuseToggle = true;
var specularToggle = true;
var reflectionToggle = true;
var bias = 0.001;

class Ray {
    constructor(origin, direction) {
        this.origin = origin;
        this.direction = direction;
    }
}

class Intersection {
    constructor(distance, point) {
        this.distance = distance;
        this.point = point;
    }
}

class Hit {
    constructor(intersection, object) {
        this.intersection = intersection;
        this.object = object;
    }
}

/*
    Intersect objects
*/
function raySphereIntersection(ray, sphere) {
    var center = sphere.center;
    var radius = sphere.radius;

    // Compute intersection
    var intersection = new Intersection(Infinity, null);

    var eyeCenter = sub(ray.origin, center);

    var a = dot(ray.direction, ray.direction);

    var b = 2 * dot(eyeCenter, ray.direction);
    
    var c = dot(eyeCenter, eyeCenter) - radius*radius

    var discriminant =  b * b - 4 * a* c;


    if(discriminant < 0){
        return null;
    }else{

        var e = Math.sqrt(discriminant)
        var denom = 2 * a;

        var t = (-b - e)/denom;

        if(t > bias){
            intersection.distance = t;
            var scaledOrigin = scale(ray.direction, t);
            intersection.point = add(ray.origin, scaledOrigin);

            return intersection;
        }

        var t = (-b+e) / denom;

        if(t > bias){
            intersection.distance = t;
            var scaledOrigin = scale(ray.direction, t);
            intersection.point = add(ray.origin, scaledOrigin);
            return intersection

        }

    }
    return null;

    // If there is a intersection, return a new Intersection object with the distance and intersection point:
    // E.g., return new Intersection(t, point);

    // If no intersection, return null
}

function rayPlaneIntersection(ray, plane) {
    var point = plane.center;
    var normal = plane.normal;

    var intersection = new Intersection(Infinity, null);

    var substraction = sub(point, ray.origin);
    var up = dot(substraction, normal);
    var denom = dot(ray.direction, normal);

    if(denom != 0){
        var t = up / denom;

        if(t > bias){
            var scaledOrigin = scale(ray.direction, t);

            intersection.distance = t;
            intersection.point = add(ray.origin, scaledOrigin)

            return intersection;
        }
        return null;
    }
    return null;

    // Compute intersection

    // If there is a intersection, return a dictionary with the distance and intersection point:
    // E.g., return new Intersection(t, point);

    // If no intersection, return null

}

function intersectObjects(ray, depth) {

    // console.log(ray, depth)

    // Loop through all objects, compute their intersection (based on object type and calling the previous two functions)
    // Return a new Hit object, with the closest intersection and closest object

    var closest = new Hit(new Intersection(Infinity, null), null);

    for(var i = 0; i < scene.objects.length ; i++){
        var object = scene.objects[i];
        var intersect = null;
        if(scene.objects[i].type == 'plane'){            
            intersect = rayPlaneIntersection(ray, object);
            // console.log(intersect)
        }else if(scene.objects[i].type == 'sphere'){
            intersect = raySphereIntersection(ray, object);
        }

        if(intersect !== null && intersect.distance < closest.intersection.distance){
            closest.intersection = intersect;
            closest.object = object
        }

    }
    if(closest.object == null){
        return null;
    }else if(closest.object != null){
        return closest;
    }
    // If no hit, retur null
    return null

}

function sphereNormal(sphere, pos) {
    // Return sphere normal
    // pos is the intersection.point
    var subs = sub(pos, sphere.center);
    return subs;

}

function isInShadow(hit, light) {

    // Check if there is an intersection between the hit.intersection.point point and the light
    // If so, return true
    // If not, return false
    var shadowRay = new Ray(hit.intersection.point, sub(light.position, hit.intersection.point))
    // var shadowRay = new Ray(hit.intersection.point, light.position)

    var checkShadow = intersectObjects(shadowRay, 0);
    // console.log(checkShadow)

    if(checkShadow == null){
        return false
    }else if(checkShadow.intersection == null){
        return false;
    }else{
        return true;
    }


}


/*
    Shade surface
*/
function shade(ray, hit, depth) {
    var object = hit.object;
    var color = [0,0,0];

    var point = hit.intersection.point;
    
    
    // Compute object normal, based on object type
    // If sphere, use sphereNormal, if not then it's a plane, use object normal
    var normal;
    if(object.type == 'sphere'){
        normal = normalize(sphereNormal(object, point));
    }else if(object.type == 'plane'){
        normal = normalize(object.normal);
    }

    // Loop through all lights, computing diffuse and specular components *if not in shadow*

    var diffuse = 0;
    var specular = 0;
    var n = dot(normal, normal);

    for(var i=0; i<scene.lights.length; i++) {
        // console.log('c')
        var light = scene.lights[i];
        if(isInShadow(hit, light) == false) {
            // console.log(false)
            var l = normalize(sub(light.position, point));
            var h = normalize(add(l,mult(ray.direction,-1)));

            var contrib = dot(l, normal);
            // console.log(contrib)
            if(contrib > 0) diffuse += contrib;
            // diffuse += contrib;

            // specular += Math.max(0, Math.pow(dot(normal, mult(add(l, h), 0.5)), object.specularExponent))            

            var sc = scale(normal, -2*contrib/n);
            var M = add(l, sc)

            var calc = Math.pow(dot(M, ray.direction) / Math.sqrt(dot(M, M) * dot(ray.direction, ray.direction)), object.specularExponent);
            var sp = Math.max(0, calc)
            specular += sp
            // console.log(reflectedColor, test)
            // ... compute diffuse and specular components here ...
            // diffuse += ...
            // specular += ...
        }
    }
    // console.log(object.specularK*specular)
    if(specularToggle)
        color = add(color,mult([255,255,255], object.specularK*specular));
        // color = add(color, test)
        // console.log(color)
    if(ambientToggle)
        color = add(color,mult(object.color, object.ambientK));
        // console.log(color)
    if(diffuseToggle)
        color = add(color,mult(object.color, object.diffuseK*diffuse));

    // console.log(color)

    // Combine colors, taking into account object constants

    // Handle reflection, make sure to call trace incrementing depth

    if(reflectionToggle){
        if(maxDepth > 0){
            // console.log(maxDepth, depth)
            // console.log(depth)
            var scaled = scale(normal, -2*dot(normal, ray.direction)/n);
            // console.log(scaled)
            var reflection = add(ray.direction, scaled);

            var refRay = new Ray(point, reflection)
            var recColor = trace(refRay, ++depth)

            // console.log(refRay)
            // console.log(recColor, object.reflectiveK)
            if(recColor){
                var reflectiveness = scale(recColor, object.reflectiveK)
                // var localColor = scale(color, (1-object.reflectiveK))

                return add(reflectiveness, color)

            }
            
        }

    }


    return color;
}


/*
    Trace ray
*/
function trace(ray, depth) {
    if(depth > maxDepth) return background_color;
    var hit = intersectObjects(ray, depth);
    // console.log("count")
    if(hit != null) {
        // console.log("count")
        var color = shade(ray, hit, depth);
        return color;
    }
    return null;
}



/*
    Render loop
*/
function render(element) {
    // console.log(unitVector([2,2,3]))
    if(scene == null)
        return;
    
    var width = element.clientWidth;
    var height = element.clientHeight;
    element.width = width;
    element.height = height;
    scene.camera.width = width;
    scene.camera.height = height;

    var ctx = element.getContext("2d");
    var data = ctx.getImageData(0, 0, width, height);

    var eye = normalize(sub(scene.camera.direction,scene.camera.position));
    var right = normalize(cross(eye, [0,1,0]));
    var up = normalize(cross(right, eye));
    var fov = ((scene.camera.fov / 2.0) * Math.PI / 180.0);

    var halfWidth = Math.tan(fov);
    var halfHeight = (scene.camera.height / scene.camera.width) * halfWidth;
    var pixelWidth = (halfWidth * 2) / (scene.camera.width - 1);
    var pixelHeight = (halfHeight * 2) / (scene.camera.height - 1);

    for(var x=0; x < width; x++) {
        for(var y=0; y < height; y++) {
            var vx = mult(right, x*pixelWidth - halfWidth);
            var vy = mult(up, y*pixelHeight - halfHeight);
            var direction = normalize(add(add(eye,vx),vy));
            var origin = scene.camera.position;

            var ray = new Ray(origin, direction);
            // debug
            // if(x == 10){
            //     console.log(ray)
            // }


            var color = trace(ray, 0);
            if(color != null) {
                var index = x * 4 + y * width * 4;
                data.data[index + 0] = color[0];
                data.data[index + 1] = color[1];
                data.data[index + 2] = color[2];
                data.data[index + 3] = 255;
            }
        }
    }
    console.log("done");
    ctx.putImageData(data, 0, 0);
}

/*
    Handlers
*/
window.handleFile = function(e) {
    var reader = new FileReader();
    reader.onload = function(evt) {
        var parsed = JSON.parse(evt.target.result);
        scene = parsed;
    }
    reader.readAsText(e.files[0]);
}

window.updateMaxDepth = function() {
    maxDepth = document.querySelector("#maxDepth").value;
    var element = document.querySelector("#canvas");
    render(element);
}

window.toggleAmbient = function() {
    ambientToggle = document.querySelector("#ambient").checked;
    var element = document.querySelector("#canvas");
    render(element);
}

window.toggleDiffuse = function() {
    diffuseToggle = document.querySelector("#diffuse").checked;
    var element = document.querySelector("#canvas");
    render(element);
}

window.toggleSpecular = function() {
    specularToggle = document.querySelector("#specular").checked;
    var element = document.querySelector("#canvas");
    render(element);
}

window.toggleReflection = function() {
    reflectionToggle = document.querySelector("#reflection").checked;
    var element = document.querySelector("#canvas");
    render(element);
}

/*
    Render scene
*/
window.renderScene = function(e) {
    var element = document.querySelector("#canvas");
    render(element);
}