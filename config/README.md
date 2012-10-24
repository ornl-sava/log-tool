global.json - core settings, keeps track of available modules and their properties.

parsers.json - keeps track of named parsers.

input.json - keeps track of named input sources. This includes a reference to their associated parser, in parsers.json.

output.json - keeps track of named output sources.

connections.json - keeps track of which combinations of input/parser/output names to actually use

All files should be modified manually as needed; these files will not be written to or otherwise modified.

