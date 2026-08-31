// let char = "sds `"

// char.split("").forEach((ele) => console.log(ele, ele.charCodeAt()))
// console.log("--------------------")
// // char.split("").forEach((ele) => console.log(ele, ele.toString()))


process.stdin.setRawMode(true)

process.stdin.on("data", (key) => {
    console.log(key)
    console.log(key.toString())
})
