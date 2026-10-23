const cache = new Map();

export function setCache(key,data,duration = 60000){
    cache.set(key,{data,expiry: Date.now() + duration});
}

export function getcache(key){
    const item = cache.get(key);
    if(!item){
        return null;
    }

    if(Date.now() > item.expiry){
        cache.delete(key);
        return null;
    }

    return item.data;
}