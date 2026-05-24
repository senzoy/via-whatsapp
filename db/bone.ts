import { AddBone } from "./mongodb.js";

AddBone(25000).then(() => {
    console.log('Bono otorgado')
}).catch((e) => {
    console.log('Error al otorgar bono')
})