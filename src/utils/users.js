const users = []

const addUser = ({id,username,room}) =>{
    // clean data
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    // check required data
    if(!username || !room){
        return {error: 'username or room must be required'}
    }

    //check if data is exist
    const checkExsistingUser= users.find((user)=>{
        return user.room === room && user.username === username
    })

    if(checkExsistingUser){
        return {error: 'this username has been esisted'}
    }

    // store user
    const user = {id,username,room}
    users.push(user)
    return {user}
}

const removeUser = (id) =>{

    const index = users.findIndex((user)=> user.id === id)// nếu không tìm được -> index = -1

    if(index !== -1) {
        return users.splice(index,1)[0] // trỏ user đã xóa vì chỉ xóa 1 phần tử
    }
}

const getUser = (id) =>{
    const user = users.find((user)=> user.id === id)
    return user
}

const getUserInRoom = (room) =>{
    room = room.trim().toLowerCase() // clean data cho room nếu cần
    const usersInRoom = users.filter((user)=> user.room === room)
    return usersInRoom
}

module.exports ={
    addUser,
    removeUser,
    getUser,
    getUserInRoom
}

