var fs = require('fs');

var RESULT_FILE = 'pandora.json';
var output = [];
var result = [];

(function readFiles(dirname, onFileContent, onError) {
    fs.readdir(dirname, function(err, filenames) {
        if (err) {
            onError(err);
            return;
        }

        filenames.forEach(function(filename) {
        	output.push(require(dirname + '/' + filename));
        });

        onFileContent(output);
    });
})('./output/', function (output) {
	for (var i in output) {
		var row = output[i];
		var posts = row.clusters;

		// console.log(posts)

		for (var j in posts) {
			var post = posts[j];
			if (!post.a) continue;
			
			for (var p in post.a) {
				pp = post.a[p]
				var item = {
					title: pp.t,
					url: pp.u,
					s: pp.s,
					sp: pp.sp,
					date: pp.d,
					timestamp: pp.tt
				}
				result.push(item);
			}
		}
	}

	var json = JSON.stringify(result, null, 4); 
	fs.writeFile(RESULT_FILE, json, (err) => {
		if (!err) console.log('Success!')
		else console.log('Error!');
	});
});