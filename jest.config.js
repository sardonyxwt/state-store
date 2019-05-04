module.exports = {
	testURL: "http://localhost",
	moduleFileExtensions: [ "ts", "js" ],
	transform: {
		"^.+\\.ts$": "ts-jest"
	},
	testRegex: "/test/.*\\.test\\.ts$"
};
