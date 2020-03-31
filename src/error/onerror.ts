export function OnError(handler: (err: any) => void) {
    return (_target: any, _key: any, descriptor: PropertyDescriptor): PropertyDescriptor => {
        const method = descriptor.value;
        descriptor.value = function (this: any, ...args: any): ReturnType<typeof method> {
            try {
                let ret = method.apply(this, args);
                if (ret instanceof Promise) {
                    ret = ret.catch(handler);
                }
                return ret;
            } catch (error) {
                handler(error);
            }
        };
        return descriptor;
    };
}
