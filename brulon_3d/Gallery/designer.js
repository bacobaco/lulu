//---------------------------------------------------------------
//gallery designer information: Designed by Daniel Presedo.
//---------------------------------------------------------------
//Specify the maximum allowable photo size for each location in your gallery.
//Sizes are in feet; use the Builder application to help determine reasonable size limits.
//Also specify the rotation of the Viewpoint plane objects, if required.
//                     photo0   photo1   photo2   photo3     photo4    photo5   photo6   photo7   photo8   photo9     photo10     photo11
gPhotoXmax = new Array("7.00", "7.00",  "7.00",  "7.00",    "7.00",    "7.00",  "7.00",  "7.00",  "7.00",  "7.00",    "7.00",    "7.00" );
gPhotoYmax = new Array("7.00",  "7.00",  "7.00",  "7.00",   "7.00",    "7.00",  "7.00",  "7.00",  "7.00",  "7.00",    "7.00",    "7.00" );
gPhotoYrot = new Array("180",    "0",     "0",    "-90",   "-90",      "-90",    "90",     "90",    "90",    "180",    "180",     "-90" );

//specify an additional message to be displayed by the designer following the user welcome message. (set to "" if none desired)
gWelcomeMsgDesigner = "";

//specify a default background sound. (set to "" if none desired)
backgroundSound		    = Sound ("house.mp3");
backgroundSound.volume  = 0.8;
backgroundSound.repeats = 0;
backgroundSound.play();
gGuidedTourSpeed = 4.5;

glareEffect.brightness = 1.0;
glareEffect.radius     = 16;
glareEffect.active     = true;

// ============================================================
// Adding left door and setting up initial conditions
// ============================================================
doorLeft             = Model("./doorLeft.aer").add();

dump(doorLeft);


hingeLeft             = Model("./hingeLeft.aer").add();


doorRight             = Model("./doorRight.aer").add();

dump(doorRight);

hingeRight             = Model("./hingeRight.aer").add();

checker          = new Object();
checker.solver   = FastConstraintSolver();
checker.timestep = function(now)
{
    if (!doorLeft.loaded) return;
    if (!doorRight.loaded) return;
    if (!hingeLeft.loaded) return;
    if (!hingeRight.loaded) return;
    
	doorLeft.anchor      = stageModel.getSolidObject(0).rootPrimitive.find(".../doorLeft");
	doorLeft.position    = doorLeft.anchor.position;
	doorLeft.orientation = doorLeft.anchor.orientation;
	doorLeft.pivot       = doorLeft.anchor.position; // location of hinge
	doorLeft.axis        = Vector (0,1,0); // axis of hinge

	doorRight.anchor      = stageModel.getSolidObject(0).rootPrimitive.find(".../doorRight");
	doorRight.position    = doorRight.anchor.position;
	doorRight.orientation = doorRight.anchor.orientation;
	doorRight.pivot       = doorRight.anchor.position;
	doorRight.axis        = Vector (0,1,0);

	hingeLeft.anchor      = stageModel.getSolidObject(0).rootPrimitive.find(".../hingeLeft");
	hingeLeft.position    = hingeLeft.anchor.position;
	hingeLeft.orientation = hingeLeft.anchor.orientation;

	hingeRight.anchor      = stageModel.getSolidObject(0).rootPrimitive.find(".../hingeRight");
	hingeRight.position    = hingeRight.anchor.position;
	hingeRight.orientation = hingeRight.anchor.orientation;

    doorLeft.physicalModel          = doorLeft.createConvexPhysicalModel(2);
    doorLeft.physicalModel.collide  = true;
    doorRight.physicalModel         = doorRight.createConvexPhysicalModel(2);
    doorRight.physicalModel.collide = true;
 
    hingeLeft.physicalModel  = hingeLeft.createConvexPhysicalModel(0);
    hingeLeft.physicalModel.fixed = true;
    hingeRight.physicalModel = hingeRight.createConvexPhysicalModel(0);
    hingeRight.physicalModel.fixed = true;
    
    constraint = this.solver.createHingeConstraint (doorLeft.physicalModel, hingeLeft.physicalModel);
    constraint.setWorldSpacePivotAndAxis (doorLeft.pivot, doorLeft.axis);
    this.solver.addConstraint (constraint);

    doorLeft.angularDashpot = this.solver.createAngularDashpot (doorLeft.physicalModel, hingeLeft.physicalModel);
    doorLeft.angularDashpot.setRotation (Rotation ('Y', 0.0));
	doorLeft.angularDashpot.strength = .5;
	this.solver.addAngularDashpot (doorLeft.angularDashpot);

	constraint = this.solver.createHingeConstraint (doorRight.physicalModel, hingeRight.physicalModel);
	constraint.setWorldSpacePivotAndAxis (doorRight.pivot, doorRight.axis);
	this.solver.addConstraint (constraint);

	doorRight.angularDashpot = this.solver.createAngularDashpot (doorRight.physicalModel, hingeRight.physicalModel);
	doorRight.angularDashpot.setRotation (Rotation ('Y', 0.0));
	doorRight.angularDashpot.strength = .5;
	this.solver.addAngularDashpot (doorRight.angularDashpot);

	removeAnimator(this);
}

addAnimator(checker);