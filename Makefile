build:
	rm -f .out/spotext.zip
	mkdir -p ".out"
    # -r – recursive ; -X – ignore OS-specific files ; -9 – the slowest but effective compression
	zip -r -X -9 .out/spotext.zip . -x@.crxignore
