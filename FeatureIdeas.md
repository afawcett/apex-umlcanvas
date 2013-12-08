Ideas
=====

The following are some ideas to extend the tool further, help on these or new ones most welcome!

 - Add support for other [class level relationships](http://en.wikipedia.org/wiki/Class_diagram#Class_level_relationships)? (Ref#1)
 - Ways to persist and/or recognise UML metadata (notes and annotations) from the diagrams, either as comments in the Apex classes and or as a Document (JSON data?) in the org perhaps? (Ref#2)
 - Wondering how we can provide ways for users to teach it to show certain UML stereo types, to recognise vf controllers, services and such like, perhaps map some styling to the stereo types? Perhaps have it parse comments in the Apex class for custom annotations? (Ref#3)
 - Support a different rendering engines, an abstraction layer to base different renders on. Regarding PlantUML and Heroku running Graphviz. There even exists a Heroku buildpack with Graphviz on Github but I was not yet able to get this running: https://github.com/jeluard/heroku-buildpack-graphviz (Ref#4)
