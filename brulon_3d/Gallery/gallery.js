//----------------------------------------------------------------------------
//Three separate scripts are used to run this gallery:
//"designer.js" - specifies gallery designer information, such as the
//                maximum photo sizes for a given gallery location,
//                required rotations for the viewpoint planes, etc.
//"user.js"     - specifies user information for this gallery. It contains
//                arrays for the photo URLs, photo descriptions, and more.
//"gallery.js"  - this script, which processes all above data. Keeping the
//                data separate from the processing allows for future
//                enhancements to this script, and easier bug fixing.
//---------------------------------------------------------------------------


//---------------------------------------------------------------
//gallery processing routines
//---------------------------------------------------------------

rootPath = "";
galleryScript = Object();
galleryScript.onLoad = function(now)
{
	//forcibly turn off chat, navigation, and tabs UI prior to any other task
	application.tabsVisible          = false;
	application.navigationBarVisible = false;
	application.chatRegionVisible    = false;
	
	//specify the fade durations for photo swapping
	fadeInDuration = 1.5; // time in seconds
	fadeOutDuration = 1.0; // time in seconds

	//load the plane objects and set their rotation, path, scale, etc.
	planeLoaderTimestep = function(now, deltaTime)
	{
		if (!this.image) return; // No image specified for this plane
		if (!this.instance)
		{
			this.instance = this.plane.scene.getInstance("photoIns");
			if (this.instance)
			{
				//rotate the instance
				this.instance.rotation = [ -90, gPhotoYrot[this.index], 0 ];
				this.instance.opacity = 0.0;
			}
			else
			{
				return;
			}
		}
		
		if (!this.timeElem)
		{
			this.timeElem = this.plane.scene.getTimeElem("photoElem");
			if (this.timeElem)
			{
				if (this.image.photoURL != "")
				{
					//set new path
					this.timeElem.running = false;
					
					if (this.firstTimeForPath)
					{
						this.basePath = this.timeElem.path;
						this.firstTimeForPath = false;
					}

					this.curPath = this.basePath;
					subDirString = "gallery";
					newPath = this.curPath.substring( 0, this.curPath.lastIndexOf("\\") - (subDirString.length + 1));
					this.newPath = newPath;
					rootPath = newPath;
					this.timeElem.path = this.newPath + "\\images\\" + this.image.photoURL;
					this.timeElem.running = true;
				}
			}
			if (!this.timeElem) return;
		}
		
		if (!this.texture)
		{
			this.texture = this.instance.getMaterial("photoMat").getDiffuseTexture("photoTex");
			if (!this.texture) return;
		}
		
		if (!this.resized)
		{					
			if (!this.timeElem.isStreaming)
			{
				// The new texture has arrived since streaming has stopped
				// Logic for dynamically resizing photos
				this.Xpixels = this.texture.getWidth();
				this.Ypixels = this.texture.getHeight();
				this.Xratio  = ( this.Xpixels / gPhotoXmax[this.index] );
				this.Yratio  = ( this.Ypixels / gPhotoYmax[this.index] );
				this.bigDiff = Math.max(this.Xratio, this.Yratio);
				this.instance.scale = [ this.Xpixels / this.bigDiff, 1, this.Ypixels / this.bigDiff ];
				this.resized = true;
				this.fadeIn = true;
			}
			else
			{
				// Not finished streaming yet
				return;
			}
		}
		
		if (!this.info)
		{
			if (this.image.onClickSoundURL && this.image.onClickSoundURL != "")
			{
				if ( (this.image.onClickSoundURL.indexOf(".mp3") > -1) || (this.image.onClickSoundURL.indexOf(".wav") > -1) )
				{
					this.plane.onClickSound   = Sound(this.image.onClickSoundURL);
					this.plane.event.position = this.position;
					this.plane.event.volume   = 1;
					this.plane.event.near     = 3;   //max within this radius
					this.plane.event.far      = 2000;  //silent beyond this radius
					this.plane.event.repeats  = 1;   //loop=0
				}
			}

			//set onClick event
			this.plane.onClick = function()
			{
				// The variable "this" is now the plane not the parent object
				messageString = "parent.caption.location.href = './pages/" + this.image.pageURL +"'";
				sendJS(messageString);

				if (this.image.onClickSoundURL != "")
				{
					this.plane.onClickSound.play();
				}
			}

			this.info = true;
		}
		
		if (this.fadeIn)
		{
			this.instance.opacity = this.instance.opacity + deltaTime / fadeInDuration;
			if (this.instance.opacity > 1.0)
			{
				this.instance.opacity = 1.0;
				this.fadeIn = false;
			}
		}
		
		if (this.fadeOut)
		{
			this.instance.opacity = this.instance.opacity - deltaTime / fadeOutDuration;
			if (this.instance.opacity < 0.0)
			{
				this.instance.opacity = 0.0;
				this.fadeOut = false;
				removeAnimator(VPplane[this.index]);
			}
		}
	}

	//---------------------------------------------------------------
	//create texture loading animators for each VPplane
	//---------------------------------------------------------------
	numPlanes = gPhotoXmax.length;
	VPplane   = new Array();
	for (i = 0; i < numPlanes; i++)
	{
		VPplane[i] = new Object;
		VPplane[i].changed = true;
		VPplane[i].firstTimeForPath = true;
	}

	loadCount    = 0;
	loadAll      = new Object();

	loadAll.defineSet = function(setNum)
	{
		this.startFadeOut = true;
		loadAll.totalLoaded = 0;
		loadAll.minIndex = numPlanes * (setNum - 1);
		loadAll.maxIndex = loadAll.minIndex + numPlanes - 1;
		for (i = 0; i < numPlanes; i++)
		{
			VPplane[i].changed = true;
		}
	}

	numImageSets = Math.ceil((gImageArray.length) / numPlanes);

	loadAll.timestep = function(now, deltaTime)
	{
		if (this.startFadeOut)
		{
			this.startFadeOut = false;
			this.timeStartFadeOut = now;
			for (count = 0; count < numPlanes; count++)
			{
				VPplane[count].fadeOut = true;
			}
		}
		
		if (now - this.timeStartFadeOut > fadeOutDuration)
		{
			//find VP planes, and create unique animators
			for (count = this.minIndex; count <= this.maxIndex; count++)
			{
				planeNumber = count - this.minIndex;
				imageNumber = count;

				VPplane[planeNumber].plane = stageModel.getViewpointObject( "photo" + planeNumber);

				if (VPplane[planeNumber].plane && VPplane[planeNumber].changed)
				{
					this.totalLoaded++;
					VPplane[planeNumber].changed = false;
					VPplane[planeNumber].index   = planeNumber;

					if (imageNumber < gImageArray.length)
					{
						VPplane[planeNumber].image   = gImageArray[imageNumber];
					}
					else
					{
						VPplane[planeNumber].image   = false;
					}

					VPplane[planeNumber].plane.image = VPplane[planeNumber].image;

					VPplane[planeNumber].instance  = false;
					VPplane[planeNumber].timeElem  = false;
					VPplane[planeNumber].texture   = false;
					VPplane[planeNumber].newPath   = false;
					VPplane[planeNumber].curPath   = false;
					VPplane[planeNumber].resized   = false;
					VPplane[planeNumber].info      = false;
					VPplane[planeNumber].fadeIn    = false;
					VPplane[planeNumber].fadeOut   = false;

					VPplane[planeNumber].timestep  = planeLoaderTimestep;

					//add the above animator
					addAnimator(VPplane[planeNumber]);
					if (this.totalLoaded == gImageArray.length) removeAnimator(loadAll);
				}
			}
		}
	}

	loadAll.defineSet(1);
	addAnimator(loadAll);

	if (numImageSets >= 1)
	{
		for (i = 1; i <= numImageSets; i++)
		{
			firstImage = (i - 1) * numPlanes + 1;
			lastImage = (i) * numPlanes;
			if (lastImage > gImageArray.length) lastImage = gImageArray.length;

			itemName = firstImage + " - " + lastImage;
			sendJS("populateMenu(" + i + ", " + "\"" + itemName + "\"" + ");"); 
			button = Button(itemName).add();
			button.setNumber = i;
			button.onClick = function()
			{
				loadAll.defineSet(this.setNumber);
				sendJS("updateMenu(" + this.setNumber + ");");
			}
		}
	}

	//populate tour button label
	sendJS("setTourButtonLabelStart()");

	//tell the webpage that the world script is loaded
	sendJS("worldLoaded()");

	removeAnimator(galleryScript);
}

turnOnChat = function()
{
	application.chatRegionVisible    = true;
}

turnOffChat = function()
{
	application.chatRegionVisible    = false;
}

addAnimator(galleryScript);