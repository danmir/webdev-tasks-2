var MongoClient = require('mongodb').MongoClient;
var async = require('async');

var tasks = [];

function compareRequest(where, operator, compareWith) {
    var operators = {
        '!=': {$ne: compareWith},
        '==': compareWith,
        '>': {$gt: compareWith},
        '<': {$lt: compareWith}
    };
    return {[where]: operators[operator]}
}

var multivarka = {
    /**
     * Подключение к mongodb
     * Обязательное 1-ое действие
     * @param connStr
     * @returns {multivarka}
     */
    server: function (connStr) {
        tasks.push(function (cb) {
            MongoClient.connect(connStr, function(err, db){
                // console.log(db);
                var params = {db};
                cb(err, params);
            });
        });
        return this;
    },
    /**
     * Выбор коллекции
     * Обязательное 2-ое действие
     * @param collectionName
     * @returns {multivarka}
     */
    collection: function (collectionName) {
        tasks.push(function (params, cb) {
            var collection = params.db.collection(collectionName);
            var params = {db: params.db, collection};
            cb(null, params);
        });
        return this;
    },
    /**
     * Поле, по которому будет производиться выборка
     * Обязательно в запросе на поиск, изменение, удаление
     * @param where
     * @returns {multivarka}
     */
    where: function (where) {
        tasks.push(function (params, cb) {
            var isNot = false;
            params.isNot = isNot;
            params.where = where;
            cb(null, params);
        });
        return this;
    },
    /**
     * Отрицание к следующему оператору
     * @returns {multivarka}
     */
    not: function () {
        tasks.push(function (params, cb) {
            var isNot = true;
            params.isNot = isNot;
            cb(null, params);
        });
        return this;
    },
    /**
     * Проврека на равенство
     * Использовать после where
     * @param equalVal
     * @returns {multivarka}
     */
    equal: function (equalVal) {
        tasks.push(function (params, cb) {
            if (params.isNot) {
                params.findArgs = compareRequest(params.where, '!=', equalVal);
                return cb(null, params);
            }
            params.findArgs = compareRequest(params.where, '==', equalVal);
            cb(null, params);
        });
        return this;
    },
    /**
     * Проврека <
     * Использовать после where
     * @param lessThanVal
     * @returns {multivarka}
     */
    lessThan: function (lessThanVal) {
        tasks.push(function (params, cb) {
            if (params.isNot) {
                params.findArgs = compareRequest(params.where, '>', lessThanVal);
                return cb(null, params);
            }
            params.findArgs = compareRequest(params.where, '<', lessThanVal);
            cb(null, params);
        });
        return this;
    },
    /**
     * Проврека >
     * Использовать после where
     * @param greatThanVal
     * @returns {multivarka}
     */
    greatThan: function (greatThanVal) {
        tasks.push(function (params, cb) {
            if (params.isNot) {
                params.findArgs = compareRequest(params.where, '<', greatThanVal);
                return cb(null, params);
            }
            params.findArgs = compareRequest(params.where, '>', greatThanVal);
            cb(null, params);
        });
        return this;
    },
    /**
     * Использовать после where
     * @param includeArr
     * @returns {multivarka}
     */
    include: function (includeArr) {
        tasks.push(function (params, cb) {
            var stmt = [];
            if (params.isNot) {
                for (var idx in includeArr) {
                    stmt.push({$ne: includeArr[idx]});
                }
                params.findArgs = {
                    [params.where]: stmt
                };
                return cb(null, params);
            }
            for (var idx in includeArr) {
                stmt.push({[params.where]: includeArr[idx]});
            }
            params.findArgs = {$or: stmt};
            cb(null, params);
        });
        return this;
    },
    /**
     * Терминальное состояние запроса
     * Поиск по критериям
     * @param userCallback
     */
    find: function (userCallback) {
        tasks.push(function (params, cb) {
            params.collection.find(params.findArgs).toArray(function (err, docs) {
                userCallback(err, docs);
                params.db.close();
            });
        });
        async.waterfall(tasks, function (err, result) {
            console.log(err, result);
        });
    },
    /**
     * Терминальное состояние
     * Удаление по критериям
     * @param userCallback
     */
    remove: function (userCallback) {
        tasks.push(function (params, cb) {
            params.collection.remove(params.findArgs, null, function (err, result) {
                userCallback(err, result);
                params.db.close();
            });
        });
        async.waterfall(tasks, function (err, result) {
            console.log(err, result);
        });
    },
    /**
     * Установка критериев для последующего обновления
     * документа в базе
     * @param field
     * @param value
     * @returns {multivarka}
     */
    set: function (field, value) {
        tasks.push(function (params, cb) {
            var setArgs = {[field]: value};
            params.setArgs = {$set: setArgs};
            params.optionArgs = {multi: true};
            cb(null, params);
        });
        return this;
    },
    /**
     * Терминальное состояние
     * Обновление документа
     * @param userCallback
     */
    update: function (userCallback) {
        tasks.push(function (params, cb) {
            params.collection.update(params.findArgs, params.setArgs, params.optionArgs,
                function (err, result) {
                    userCallback(err, result);
                    params.db.close();
            });
        });
        async.waterfall(tasks, function (err, result) {
            console.log(err, result);
        });
    },
    /**
     * Терминальное состояние
     * Добавление документа в базу
     * @param doc
     * @param userCallback
     */
    insert: function (doc, userCallback) {
        tasks.push(function (params, cb) {
            params.collection.insert(doc, null, function (err, result) {
                userCallback(err, result);
                params.db.close();
            })
        });
        async.waterfall(tasks, function (err, result) {
            console.log(err, result);
        });
    }
};

module.exports = multivarka;
