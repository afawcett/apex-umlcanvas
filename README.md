Apex UML
========

![Logo](http://andrewfawcett.files.wordpress.com/2013/10/screen-shot-2013-10-14-at-22-16-58.png)

Contributors
------------

Currently this tool has the following contributors, please join us!

- [Andrew Fawcett](https://twitter.com/andyinthecloud)
- [John M. Daniel](https://twitter.com/JohnDTheMaven)
- [James Loghry](https://twitter.com/dancinllama) (indirectly via [Apex Tooling API](https://github.com/afawcett/apex-toolingapi))

Apex UML (Native version)
-------------------------

Since Dreamforce 2013, I was contacted by [John M. Daniel](https://twitter.com/JohnDTheMaven), who asked if it was possible to create a version of the tool without using a Heroku applicaiton, by consuming the Tooling API from Apex directly. About the same time [James Loghry](https://twitter.com/dancinllama) and I had also started working on a native [Apex wrapper for the Tooling API](https://github.com/afawcett/apex-toolingapi). And so from this point forward the Apex UML tool is completly native, no Heroku instance is required!

Further information and blog posts...

- [Going Native with the Apex UML Tool and Tooling API](http://andyinthecloud.com/2014/03/17/going-native-with-the-apex-uml-tool-and-tooling-api/)

**NOTE:** If you have installed the earlier version, don't worry, simply take the latest package install link below and it will automatically upgrade you to the native version.

Apex UML (Canvas version)
-------------------------

This version of the tool is no longer live. If you still want to know more about consuming the API from a Canvas / Java context though you can read more about this tool at my blog post [here](http://andyinthecloud.com/2013/11/12/apex-uml-canvas-tool-dreamforce-release).  You can also watch the **Dreamforce 2013** presentation on how it was built [here](http://www.youtube.com/watch?v=SbWZpw0-Y5k) and download the slides from [here](https://docs.google.com/file/d/0B6brfGow3cD8U1Z2THppTlVTaGs/edit). 

Installing the Tool
-------------------

- Install via the **latest package link below**
- Ensure your **Apex classes are compiled**
- Go to **Apex Classes** page and click the **Compile all classes** link
- Navigate to the **Apex UML** page and select a class
- You will see a **Remote Site** setting message popup, follow it and then reload the page.
- Your good to go!

### Package Versions

 - [v1.6](https://github.com/afawcett/apex-umlcanvas/issues?milestone=2) Pacakge install - coming soon.

 - v1.5 Package install [link](https://login.salesforce.com/packaging/installPackage.apexp?p0=04ti0000000CqNM) - Fix for issue [5](https://github.com/afawcett/apex-umlcanvas/issues/5)
 
 - v1.4 Package install [link](https://login.salesforce.com/packaging/installPackage.apexp?p0=04ti0000000Cq9c) - Fix for issue [4](https://github.com/afawcett/apex-umlcanvas/issues/4) (depricated)

 - v1.3 Package install [link](https://login.salesforce.com/packaging/installPackage.apexp?p0=04ti0000000Cf5t) (depricated)

 - v1.2 Package install [link](https://login.salesforce.com/packaging/installPackage.apexp?p0=04ti0000000Cf5o) (depricated) 

Known Issues
------------

- **Read timeout error.** This error currently seems to appear when the Tooling API has to demand compile code to determine the Symbol Table. We will look into ways to aviod this and/or provide feedback when this is happening. In the meantime please go to the Apex Classes page and click the Compile All Classes link before using the tool.
- **Canvas App not found error.** This error occurs if you are running v1.2 of the tool, as the Canvas Connected App no longer exists, please upgrade to v1.3 or later.

Get Involved in Enhancing this Tool!
====================================

There has been great deal of interest in this tool and enhancing it since i launched it ahead of Dreamforce 2013. I'd like to start a list of ideas and enhancements for and invite the community to help build those features. Here is a list of [ideas](https://github.com/afawcett/apex-umlcanvas/blob/master/FeatureIdeas.md).
