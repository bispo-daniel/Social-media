export const isObject = (type) => (typeof type === 'object') && !Array.isArray(type) && (Object.prototype.toString.call(type) === '[object Object]');
export const isString = (type) => (typeof type === 'string') && Object.prototype.toString.call(type) === '[object String]';
export const setStorage = (data,options={for: undefined,override: true},cb=()=>{})=>{
    if (!(isObject(options) || isString(options))) return new Error('option parameter should be set as string or object');
    if (options.for || options) {
        if (options.override || isString(options)) {
            localStorage.setItem((options.for || options), JSON.stringify(data))
            cb(false);
        } 
    }
}
export const getStorage = (key,options={default: undefined}) => {
    if (!(isObject(options) || isString(options))) return new Error("option parameter should be set as string or object");
    const isObj= isObject(options) ? true : false; 
    const value = localStorage.getItem(key);
    if (value) return JSON.parse(value);
    return isObj ? options.default : options;
}

export const uniq = ()=>(Math.floor(Math.random() * Date.now() * Math.random() + Date.now())).toString();