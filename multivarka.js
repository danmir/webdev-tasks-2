var MongoClient = require('mongodb').MongoClient;
var async = require('async');

var tasks = [];

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
                cb(err, db);
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
        tasks.push(function (db, cb) {
            var collection = db.collection(collectionName);
            cb(null, collection, db);
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
        tasks.push(function (collection, db, cb) {
            var isNot = false;
            cb(null, collection, db, where, isNot);
        });
        return this;
    },
    /**
     * Отрицание к следующему оператору
     * @returns {multivarka}
     */
    not: function () {
        tasks.push(function (collection, db, where, cb) {
            var isNot = true;
            cb(null, collection, db, where, isNot);
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
        tasks.push(function (collection, db, where, isNot, cb) {
            var findStmt = {};
            if (isNot) {
                findStmt[where] = {$ne: equalVal};
                return cb(null, collection, db, findStmt);
            }
            findStmt[where] = equalVal;
            cb(null, collection, db, findStmt);
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
        tasks.push(function (collection, db, where, isNot, cb) {
            var findStmt = {};
            if (isNot) {
                findStmt[where] = {$gt: lessThanVal};
                return cb(null, collection, db, findStmt);
            }
            findStmt[where] = {$lt: lessThanVal};
            cb(null, collection, db, findStmt);
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
        tasks.push(function (collection, db, where, isNot, cb) {
            var findStmt = {};
            if (isNot) {
                findStmt[where] = {$lt: greatThanVal};
                return cb(null, collection, db, findStmt);
            }
            findStmt[where] = {$gt: greatThanVal};
            cb(null, collection, db, findStmt);
        });
        return this;
    },
    /**
     * Использовать после where
     * @param includeArr
     * @returns {multivarka}
     */
    include: function (includeArr) {
        tasks.push(function (collection, db, where, isNot, cb) {
            var stmt = [];
            var findStmt = {};
            if (isNot) {
                for (var idx in includeArr) {
                    stmt.push({$ne: includeArr[idx]});
                }
                findStmt[where] = stmt;
                return cb(null, collection, db, findStmt);
            }
            for (var idx in includeArr) {
                findStmt[where] = includeArr[idx];
                stmt.push(findStmt);
            }
            cb(null, collection, db, {$or: stmt});
        });
        return this;
    },
    /**
     * Терминальное состояние запроса
     * Поиск по критериям
     * @param userCallback
     */
    find: function (userCallback) {
        tasks.push(function (collection, db, findArgs, cb) {
            console.log(findArgs);
            collection.find(findArgs).toArray(function (err, docs) {
                userCallback(err, docs);
                db.close();
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
        tasks.push(function (collection, db, findArgs, cb) {
            console.log(findArgs);
            collection.remove(findArgs, null, function (err, result) {
                userCallback(err, result);
                db.close();
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
        tasks.push(function (collection, db, findArgs, cb) {
            var setArgs = {};
            setArgs[field] = value;
            cb(null, collection, db, findArgs, {$set: setArgs}, {multi: true});
        });
        return this;
    },
    /**
     * Терминальное состояние
     * Обновление документа
     * @param userCallback
     */
    update: function (userCallback) {
        tasks.push(function (collection, db, findArgs, setArgs, optionArgs, cb) {
            console.log(findArgs, setArgs, optionArgs);
            collection.update(findArgs, setArgs, optionArgs, function (err, result) {
                userCallback(err, result);
                db.close();
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
        tasks.push(function (collection, db, cb) {
            collection.insert(doc, null, function (err, result) {
                userCallback(err, result);
                db.close();
            })
        });
        async.waterfall(tasks, function (err, result) {
            console.log(err, result);
        });
    }
};

module.exports = multivarka;
