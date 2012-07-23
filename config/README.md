global.json - core settings, keeps track of available modules and their properties.

parsers.json - keeps track of named parsers.

input.json - keeps track of named input sources. This includes a reference to their associated parser, in parsers.json.

output.json - keeps track of named output sources.

connections.json - keeps track of which combinations of input/parser/output names to actually use

All files can be modified manually as needed. input.json, output.json, and connections.json can either be modified manually, or can be modified by the logtool program when input/output sources are added via arguments, eg. logtool add output firewall-main file /path/to/file. See logtool --help for further explination on adding/removing named input/output sources.

