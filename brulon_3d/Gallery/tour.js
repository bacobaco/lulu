//It is required that user have at least Atmosphere Player 90.
/*
minVersion = 0.90;
if (version < minVersion)
{
	chat.print("This world requires Atmosphere Player " + minVersion + " or newer.");
	chat.print(" ");
	chat.print("Check for a new version here: http://www.adobe.com/products/atmosphere/main.html");
}
*/

//-----------------------------------------------------------------------------------------------------
/*
This script will allow you to take a visitor on a guided tour.
When the visitor clicks on a sign(an object in the stage), the visitor
will automatically be taken to the location and view that you desire.

The timestep() function is the key to moving things around in a stage.
The stage has a global timestep function(it is highly recommended that
you do not modify this), but in addition, any object can have it's own
timestep function. The timestep function gets processed every time a
new frame is generated(so typically, anywhere from 10-60 times a second).
During this timestep, you can update the position of the avatar(user)
or model that you desire to move. The timestep function for this
script is located at the bottom, with additional comments as required.

For this example, anchors were created and named in the builder
application to easily identify desired tour locations. First we
"find" the anchors, assigning them to a variable we can use elsewhere.
*/
//-----------------------------------------------------------------------------------------------------

// Utility Functions 
catmullRomSplineInterpolateVectors = function(v0, v1, v2, v3, u)
{
	result = Vector(0, 0, 0);
	result = result.addScaled(v1, 2.0);

	tmp1 = Vector();
	tmp1 = tmp1.add(v2);
	tmp1 = tmp1.subtract(v0);
	result = result.addScaled(tmp1, u);

	tmp2 = Vector();
	tmp2 = tmp2.addScaled(v0, 2.0);
	tmp2 = tmp2.addScaled(v1, -5.0);
	tmp2 = tmp2.addScaled(v2, 4.0);
	tmp2 = tmp2.subtract(v3);
	result = result.addScaled(tmp2, u * u);
	
	tmp3 = Vector();
	tmp3 = tmp3.subtract(v0);
	tmp3 = tmp3.addScaled(v1, 3.0);
	tmp3 = tmp3.addScaled(v2, -3.0);
	tmp3 = tmp3.add(v3);
	result = result.addScaled(tmp3, u * u * u);

	result = result.scale(0.5);

	return(result);
}

// End of Utility Functions
// ------------------------------------------------------------------------------------------------------------

stage = stageModel.getSolidObject(0).rootPrimitive;

var anchorPoint = new Array();

couldFind = true;
gNumCameraPoints = 0;

while (couldFind)
{
	pointName = ".../point" + (gNumCameraPoints);
	anchorFound = stage.find(pointName);
	if (anchorFound)
	{
		anchorPoint[gNumCameraPoints] = anchorFound;
		gNumCameraPoints = gNumCameraPoints + 1;
	}
	else
	{
		couldFind = false;
		gNumCameraPoints =  gNumCameraPoints - 1;
	}
}

//remove chat alerts regarding camera points
/*
if (gNumCameraPoints < 1)
{
	chat.print("WARNING fount no camera points!");
}
else
{
	chat.print("Found " + gNumCameraPoints + " camera points.");
}
*/

/*
Now we create several variables which will be used to indicate
a new destination, and other information regarding user state.
*/
destination = "";         //will hold the destination name desired
newDestination = false;   //flags that a new destination has been set
transitionStartTime = 0;  //will hold the exact time that moveToPointnt began
inTransition = false;     //used to indicate that moveToPointnt is in progress

// Point 0 is the entry point for the world
currentIndex = 0;
startingIndex = 0;

/*
Add a function to change the destination variable above following a
mouse click, and set the flag for newDestination. Also, create a variable
to hold the user(player) position at moment that the click occurred. (The
"transform" property is described more thoroughly at the bottom of this page.)
*/
function moveToPoint(newIndex)
{
	newDestination = true;
	destination = anchorPoint[newIndex].transform;
	player.temp = player.transform;
	destinationIndex = newIndex;
	startingIndex = currentIndex;

	// Compute the duration of the motion based on the total length travelled;
	totalLength = 0.0;
	if (startingIndex > newIndex)
	{
		a = newIndex;
		b = startingIndex;
	}
	else
	{
		b = newIndex;
		a = startingIndex;
	}

	//remove chat alert regarding loop
	//chat.print("Looping from " + a + " to " + b);
	for ( i = a; i < b; i++)
	{
		totalLength += anchorPoint[i].position.subtract(anchorPoint[i + 1].position).length;
	}
	
	transitionDuration = totalLength / gGuidedTourSpeed 
	if (transitionDuration < 0.1) transitionDuration = 0.1;
	easeInDuration = 0.95;     // Time to speed up to max speed
	easeOutDuration = 0.95;    // Time to slow down from max speed

	if (easeInDuration > 0.5 * transitionDuration) easeInDuration = 0.5 * transitionDuration;
	if (easeOutDuration > 0.5 * transitionDuration) easeOutDuration = 0.5 * transitionDuration;
}

/* Set up the transition durations. These can be modified to affect the speed
and acceleration of the user. Note that easeInDuration + easeOutDuration
should be less than or equal to transitionDuration. Also, easeInDuration and
easeOutDuration can be zero to avoid acceleration and deceleration entirely.
*/
transitionDuration = 6.0; // Total time to move from start to end in seconds
easeInDuration = 0.95;     // Time to speed up to max speed
easeOutDuration = 0.95;    // Time to slow down from max speed

/*
This function remaps the time value to a blend value between 0 and 1. It assumes
that velocity ramps up linearly during the easeInDuration, is constant for the
main portion of the motion and then ramps down linearly during the easeOutDuration.
*/

blendFunction = function(time, startTime, totalDuration, easeInDuration, easeOutDuration)
{
    timeSinceStart = time - startTime;

    totalDistance = totalDuration - 0.5 * (easeInDuration + easeOutDuration);
    distanceTravelled = 0.0;

    startEaseOutTime = totalDuration - easeOutDuration;

    if (timeSinceStart < easeInDuration)
    {
        distanceTravelled = timeSinceStart * timeSinceStart / (easeInDuration * 2.0);
    }
    else if (timeSinceStart <= startEaseOutTime)
    {
        distanceTravelled = easeInDuration * 0.5 + (timeSinceStart - easeInDuration);
    }
    else
    {
        dt = timeSinceStart - startEaseOutTime;

        distanceTravelled = easeInDuration * 0.5 + (startEaseOutTime - easeInDuration) +
                    (dt) - (dt * dt) / (easeOutDuration * 2.0);
    }
    blendValue = distanceTravelled / totalDistance;

    if (timeSinceStart > totalDuration) blendValue = 1.0;
    return blendValue;
}

/*
In order to call a custom timestep in a stage, we must create a
variable which references an object. We therefore create an
empty JavaScript object for this purpose.
*/
avatarMe = new Object();

avatarMe.getTourTransform = function(blendValue)
{
	if (blendValue < 0.0) blendValue = 0.0;
	if (blendValue > 0.999999) blendValue = 0.999999;
	blendIndex = startingIndex + (destinationIndex - startingIndex) * blendValue;
	if (blendIndex > gNumCameraPoints - 0.0001) blendIndex = gNumCameraPoints - 0.0001;
	if (blendIndex < 0) blendIndex = 0;
	baseIndex = Math.floor(blendIndex);
	blend = blendIndex - baseIndex;
	currentIndex = Math.floor(blendIndex + 0.5);
	
	newTrans = anchorPoint[baseIndex].transform.blend(anchorPoint[baseIndex + 1].transform, blend);
	
	// However we wish to use Catmull Rom spline interpolation for the translation component

	if (baseIndex < 1)
	{
		// Extrapolate linearly beyond the beginning
		p0 = anchorPoint[0].position.add(anchorPoint[1].position.subtract(anchorPoint[0].position));
	}
	else
	{
		p0 = anchorPoint[baseIndex - 1].position;
	}

	p1 = anchorPoint[baseIndex].position;
	p2 = anchorPoint[baseIndex + 1].position;

	if (baseIndex + 2 > gNumCameraPoints)
	{
		// Extrapolate linearly beyond the end
		p3 = anchorPoint[baseIndex + 1].position.add(anchorPoint[baseIndex + 1].position.subtract(anchorPoint[baseIndex].position));
	}
	else
	{
		p3 = anchorPoint[baseIndex + 2].position;
	}

	if (true)
	{
		newPosition = catmullRomSplineInterpolateVectors(p0, p1, p2, p3, blend);
		newTrans2 = Transform(newPosition, newTrans.rotation);

		return(newTrans2);
	}
	else
	{
		return(newTrans);
	}
}

/*
Finally, add the timestep function. See comment below for an
explanation of how the use is incrementally moved toward the
final destination with each timestep.
*/

avatarMe.timestep = function(now, del)
{
	if (newDestination == true)
	{
		newDestination = false;
		transitionStartTime = now;
		inTransition = true;

		//change guided tour button label
		sendJS("setTourButtonLabelStop()");

		//turn off collision and gravity temporarily
		player.ignoreCollidePreference = true;
		player.forcedCollideSetting = false;
		player.ignoreGravityPreference = true;
		player.forcedGravitySetting = false;

		//chat.print("Starting new transition");
	}

	if ((destination != "") && (inTransition == true))
	{
		blendValue = blendFunction(now, transitionStartTime, transitionDuration, easeInDuration, easeOutDuration);
		if (blendValue >= 1.0)
		{
			blendValue = 1.0;
			inTransition = false;
			
			destinationTransform = this.getTourTransform(blendValue);
			player.alignHeadAndBodyTo(destinationTransform.rotation);
			player.position = targetTransform.translation;
			player.velocity = Vector(0.0, 0.0, 0.0);

			// Just in case we had a tall avatar that somehow went below the floor
			// use the call to place the player while avoiding collisions
			// The player is positioned while trying to avoid collisions with the floor

			stopTour();
			return;
		}
		
		targetTransform = this.getTourTransform(blendValue);
		
		doingPhysics = false;

		if (doingPhysics)
		{
			player.transformTo(player.temp.blend(destination.transform, blendValue));
			//Reset the avatar velocity to zero to prevent gravity from affecting the player's motion each frame
			// Unfortunately, if the destination causes collisions, then transformTo may move the object inside another one
			player.velocity = Vector(0.0, 0.0, 0.0);
		}
		else
		{
			player.alignHeadAndBodyTo(targetTransform.rotation);
			player.position = targetTransform.translation;
			player.velocity = Vector(0.0, 0.0, 0.0);
		}
	}

	if (application.leftMouseButtonDown)
	{
		stopTour();
	}
}

addAnimator(avatarMe);

// Start the movie playing

stopTour = function()
{
	inTransition = false;
	// This seems like a paradox, but we are actually taking the current player position
	// and putting the player there as closely as possible without colliding with other objects
	player.setPositionAvoidingCollisions(player.position);

	//change guided tour button label
	sendJS("setTourButtonLabelStart()");

	//set collision and gravity back to user preference
	player.ignoreCollidePreference = false;
	player.ignoreGravityPreference = false;
}

tourButtonPressed = function()
{
	if ( inTransition == false )
	{
		if (gNumCameraPoints < 1) return;
		currentIndex = 0;
		moveToPoint(gNumCameraPoints);
	}
	else
	{
		stopTour();
	}
}