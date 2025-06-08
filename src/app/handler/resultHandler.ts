interface ResultHandler<T> {
    IsSuccesfull: boolean;
    Value?: T
    Error?: string;
}