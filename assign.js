Object.assign = function(target, ...args) {
	for (let i = 0; i < args.length; i++) {
		const cur = args[i]
		Object.keys(cur).forEach(key => {
			target[key] = cur[key]
		})
	}
	return target
}