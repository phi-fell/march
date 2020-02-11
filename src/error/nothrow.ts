export function NoThrow(_target: any, key: any, descriptor: PropertyDescriptor): PropertyDescriptor {
    const method = descriptor.value;
    descriptor.value = function (this: any, ...args: any): ReturnType<typeof method> {
        try {
            let ret = method.apply(this, args);
            if (ret instanceof Promise) {
                ret = ret.catch((error) => {
                    console.log('NoThrow function threw an Error!: ' + error);
                });
            }
            return ret;
        } catch (error) {
            console.log('NoThrow function threw an Error!: ' + error);
        }
    };
    return descriptor;
}
