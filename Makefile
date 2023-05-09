build:
	rm -f .out/out.zip
    # -r – recursive ; -X – ignore OS-specific files ; -9 – the slowest but effective compression
	zip -r -X -9 .out/out.zip . -x@.crxignore