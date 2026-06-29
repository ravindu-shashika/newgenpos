// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'app_database.dart';

// ignore_for_file: type=lint
class $DeviceSessionTable extends DeviceSession
    with TableInfo<$DeviceSessionTable, DeviceSessionData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $DeviceSessionTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
      'id', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(1));
  static const VerificationMeta _authTokenMeta =
      const VerificationMeta('authToken');
  @override
  late final GeneratedColumn<String> authToken = GeneratedColumn<String>(
      'auth_token', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _deviceIdMeta =
      const VerificationMeta('deviceId');
  @override
  late final GeneratedColumn<String> deviceId = GeneratedColumn<String>(
      'device_id', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _warehouseIdMeta =
      const VerificationMeta('warehouseId');
  @override
  late final GeneratedColumn<int> warehouseId = GeneratedColumn<int>(
      'warehouse_id', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _customerIdMeta =
      const VerificationMeta('customerId');
  @override
  late final GeneratedColumn<int> customerId = GeneratedColumn<int>(
      'customer_id', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _billerIdMeta =
      const VerificationMeta('billerId');
  @override
  late final GeneratedColumn<int> billerId = GeneratedColumn<int>(
      'biller_id', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _userNameMeta =
      const VerificationMeta('userName');
  @override
  late final GeneratedColumn<String> userName = GeneratedColumn<String>(
      'user_name', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _userIdMeta = const VerificationMeta('userId');
  @override
  late final GeneratedColumn<int> userId = GeneratedColumn<int>(
      'user_id', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _isProvisionedMeta =
      const VerificationMeta('isProvisioned');
  @override
  late final GeneratedColumn<bool> isProvisioned = GeneratedColumn<bool>(
      'is_provisioned', aliasedName, false,
      type: DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints: GeneratedColumn.constraintIsAlways(
          'CHECK ("is_provisioned" IN (0, 1))'),
      defaultValue: const Constant(false));
  static const VerificationMeta _terminalIdMeta =
      const VerificationMeta('terminalId');
  @override
  late final GeneratedColumn<int> terminalId = GeneratedColumn<int>(
      'terminal_id', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _terminalCodeMeta =
      const VerificationMeta('terminalCode');
  @override
  late final GeneratedColumn<String> terminalCode = GeneratedColumn<String>(
      'terminal_code', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _terminalNameMeta =
      const VerificationMeta('terminalName');
  @override
  late final GeneratedColumn<String> terminalName = GeneratedColumn<String>(
      'terminal_name', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _posTokenMeta =
      const VerificationMeta('posToken');
  @override
  late final GeneratedColumn<String> posToken = GeneratedColumn<String>(
      'pos_token', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _clientTokenMeta =
      const VerificationMeta('clientToken');
  @override
  late final GeneratedColumn<String> clientToken = GeneratedColumn<String>(
      'client_token', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _activationTokenMeta =
      const VerificationMeta('activationToken');
  @override
  late final GeneratedColumn<String> activationToken = GeneratedColumn<String>(
      'activation_token', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _macAddressMeta =
      const VerificationMeta('macAddress');
  @override
  late final GeneratedColumn<String> macAddress = GeneratedColumn<String>(
      'mac_address', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _posBaseUrlMeta =
      const VerificationMeta('posBaseUrl');
  @override
  late final GeneratedColumn<String> posBaseUrl = GeneratedColumn<String>(
      'pos_base_url', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _deviceRegisteredMeta =
      const VerificationMeta('deviceRegistered');
  @override
  late final GeneratedColumn<bool> deviceRegistered = GeneratedColumn<bool>(
      'device_registered', aliasedName, false,
      type: DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints: GeneratedColumn.constraintIsAlways(
          'CHECK ("device_registered" IN (0, 1))'),
      defaultValue: const Constant(false));
  @override
  List<GeneratedColumn> get $columns => [
        id,
        authToken,
        deviceId,
        warehouseId,
        customerId,
        billerId,
        userName,
        userId,
        isProvisioned,
        terminalId,
        terminalCode,
        terminalName,
        posToken,
        clientToken,
        activationToken,
        macAddress,
        posBaseUrl,
        deviceRegistered
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'device_session';
  @override
  VerificationContext validateIntegrity(Insertable<DeviceSessionData> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('auth_token')) {
      context.handle(_authTokenMeta,
          authToken.isAcceptableOrUnknown(data['auth_token']!, _authTokenMeta));
    }
    if (data.containsKey('device_id')) {
      context.handle(_deviceIdMeta,
          deviceId.isAcceptableOrUnknown(data['device_id']!, _deviceIdMeta));
    }
    if (data.containsKey('warehouse_id')) {
      context.handle(
          _warehouseIdMeta,
          warehouseId.isAcceptableOrUnknown(
              data['warehouse_id']!, _warehouseIdMeta));
    }
    if (data.containsKey('customer_id')) {
      context.handle(
          _customerIdMeta,
          customerId.isAcceptableOrUnknown(
              data['customer_id']!, _customerIdMeta));
    }
    if (data.containsKey('biller_id')) {
      context.handle(_billerIdMeta,
          billerId.isAcceptableOrUnknown(data['biller_id']!, _billerIdMeta));
    }
    if (data.containsKey('user_name')) {
      context.handle(_userNameMeta,
          userName.isAcceptableOrUnknown(data['user_name']!, _userNameMeta));
    }
    if (data.containsKey('user_id')) {
      context.handle(_userIdMeta,
          userId.isAcceptableOrUnknown(data['user_id']!, _userIdMeta));
    }
    if (data.containsKey('is_provisioned')) {
      context.handle(
          _isProvisionedMeta,
          isProvisioned.isAcceptableOrUnknown(
              data['is_provisioned']!, _isProvisionedMeta));
    }
    if (data.containsKey('terminal_id')) {
      context.handle(
          _terminalIdMeta,
          terminalId.isAcceptableOrUnknown(
              data['terminal_id']!, _terminalIdMeta));
    }
    if (data.containsKey('terminal_code')) {
      context.handle(
          _terminalCodeMeta,
          terminalCode.isAcceptableOrUnknown(
              data['terminal_code']!, _terminalCodeMeta));
    }
    if (data.containsKey('terminal_name')) {
      context.handle(
          _terminalNameMeta,
          terminalName.isAcceptableOrUnknown(
              data['terminal_name']!, _terminalNameMeta));
    }
    if (data.containsKey('pos_token')) {
      context.handle(_posTokenMeta,
          posToken.isAcceptableOrUnknown(data['pos_token']!, _posTokenMeta));
    }
    if (data.containsKey('client_token')) {
      context.handle(
          _clientTokenMeta,
          clientToken.isAcceptableOrUnknown(
              data['client_token']!, _clientTokenMeta));
    }
    if (data.containsKey('activation_token')) {
      context.handle(
          _activationTokenMeta,
          activationToken.isAcceptableOrUnknown(
              data['activation_token']!, _activationTokenMeta));
    }
    if (data.containsKey('mac_address')) {
      context.handle(
          _macAddressMeta,
          macAddress.isAcceptableOrUnknown(
              data['mac_address']!, _macAddressMeta));
    }
    if (data.containsKey('pos_base_url')) {
      context.handle(
          _posBaseUrlMeta,
          posBaseUrl.isAcceptableOrUnknown(
              data['pos_base_url']!, _posBaseUrlMeta));
    }
    if (data.containsKey('device_registered')) {
      context.handle(
          _deviceRegisteredMeta,
          deviceRegistered.isAcceptableOrUnknown(
              data['device_registered']!, _deviceRegisteredMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  DeviceSessionData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return DeviceSessionData(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}id'])!,
      authToken: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}auth_token']),
      deviceId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}device_id']),
      warehouseId: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}warehouse_id']),
      customerId: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}customer_id']),
      billerId: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}biller_id']),
      userName: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}user_name']),
      userId: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}user_id']),
      isProvisioned: attachedDatabase.typeMapping
          .read(DriftSqlType.bool, data['${effectivePrefix}is_provisioned'])!,
      terminalId: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}terminal_id']),
      terminalCode: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}terminal_code']),
      terminalName: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}terminal_name']),
      posToken: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}pos_token']),
      clientToken: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}client_token']),
      activationToken: attachedDatabase.typeMapping.read(
          DriftSqlType.string, data['${effectivePrefix}activation_token']),
      macAddress: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}mac_address']),
      posBaseUrl: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}pos_base_url']),
      deviceRegistered: attachedDatabase.typeMapping.read(
          DriftSqlType.bool, data['${effectivePrefix}device_registered'])!,
    );
  }

  @override
  $DeviceSessionTable createAlias(String alias) {
    return $DeviceSessionTable(attachedDatabase, alias);
  }
}

class DeviceSessionData extends DataClass
    implements Insertable<DeviceSessionData> {
  final int id;
  final String? authToken;
  final String? deviceId;
  final int? warehouseId;
  final int? customerId;
  final int? billerId;
  final String? userName;
  final int? userId;
  final bool isProvisioned;
  final int? terminalId;
  final String? terminalCode;
  final String? terminalName;
  final String? posToken;
  final String? clientToken;
  final String? activationToken;
  final String? macAddress;
  final String? posBaseUrl;
  final bool deviceRegistered;
  const DeviceSessionData(
      {required this.id,
      this.authToken,
      this.deviceId,
      this.warehouseId,
      this.customerId,
      this.billerId,
      this.userName,
      this.userId,
      required this.isProvisioned,
      this.terminalId,
      this.terminalCode,
      this.terminalName,
      this.posToken,
      this.clientToken,
      this.activationToken,
      this.macAddress,
      this.posBaseUrl,
      required this.deviceRegistered});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    if (!nullToAbsent || authToken != null) {
      map['auth_token'] = Variable<String>(authToken);
    }
    if (!nullToAbsent || deviceId != null) {
      map['device_id'] = Variable<String>(deviceId);
    }
    if (!nullToAbsent || warehouseId != null) {
      map['warehouse_id'] = Variable<int>(warehouseId);
    }
    if (!nullToAbsent || customerId != null) {
      map['customer_id'] = Variable<int>(customerId);
    }
    if (!nullToAbsent || billerId != null) {
      map['biller_id'] = Variable<int>(billerId);
    }
    if (!nullToAbsent || userName != null) {
      map['user_name'] = Variable<String>(userName);
    }
    if (!nullToAbsent || userId != null) {
      map['user_id'] = Variable<int>(userId);
    }
    map['is_provisioned'] = Variable<bool>(isProvisioned);
    if (!nullToAbsent || terminalId != null) {
      map['terminal_id'] = Variable<int>(terminalId);
    }
    if (!nullToAbsent || terminalCode != null) {
      map['terminal_code'] = Variable<String>(terminalCode);
    }
    if (!nullToAbsent || terminalName != null) {
      map['terminal_name'] = Variable<String>(terminalName);
    }
    if (!nullToAbsent || posToken != null) {
      map['pos_token'] = Variable<String>(posToken);
    }
    if (!nullToAbsent || clientToken != null) {
      map['client_token'] = Variable<String>(clientToken);
    }
    if (!nullToAbsent || activationToken != null) {
      map['activation_token'] = Variable<String>(activationToken);
    }
    if (!nullToAbsent || macAddress != null) {
      map['mac_address'] = Variable<String>(macAddress);
    }
    if (!nullToAbsent || posBaseUrl != null) {
      map['pos_base_url'] = Variable<String>(posBaseUrl);
    }
    map['device_registered'] = Variable<bool>(deviceRegistered);
    return map;
  }

  DeviceSessionCompanion toCompanion(bool nullToAbsent) {
    return DeviceSessionCompanion(
      id: Value(id),
      authToken: authToken == null && nullToAbsent
          ? const Value.absent()
          : Value(authToken),
      deviceId: deviceId == null && nullToAbsent
          ? const Value.absent()
          : Value(deviceId),
      warehouseId: warehouseId == null && nullToAbsent
          ? const Value.absent()
          : Value(warehouseId),
      customerId: customerId == null && nullToAbsent
          ? const Value.absent()
          : Value(customerId),
      billerId: billerId == null && nullToAbsent
          ? const Value.absent()
          : Value(billerId),
      userName: userName == null && nullToAbsent
          ? const Value.absent()
          : Value(userName),
      userId:
          userId == null && nullToAbsent ? const Value.absent() : Value(userId),
      isProvisioned: Value(isProvisioned),
      terminalId: terminalId == null && nullToAbsent
          ? const Value.absent()
          : Value(terminalId),
      terminalCode: terminalCode == null && nullToAbsent
          ? const Value.absent()
          : Value(terminalCode),
      terminalName: terminalName == null && nullToAbsent
          ? const Value.absent()
          : Value(terminalName),
      posToken: posToken == null && nullToAbsent
          ? const Value.absent()
          : Value(posToken),
      clientToken: clientToken == null && nullToAbsent
          ? const Value.absent()
          : Value(clientToken),
      activationToken: activationToken == null && nullToAbsent
          ? const Value.absent()
          : Value(activationToken),
      macAddress: macAddress == null && nullToAbsent
          ? const Value.absent()
          : Value(macAddress),
      posBaseUrl: posBaseUrl == null && nullToAbsent
          ? const Value.absent()
          : Value(posBaseUrl),
      deviceRegistered: Value(deviceRegistered),
    );
  }

  factory DeviceSessionData.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return DeviceSessionData(
      id: serializer.fromJson<int>(json['id']),
      authToken: serializer.fromJson<String?>(json['authToken']),
      deviceId: serializer.fromJson<String?>(json['deviceId']),
      warehouseId: serializer.fromJson<int?>(json['warehouseId']),
      customerId: serializer.fromJson<int?>(json['customerId']),
      billerId: serializer.fromJson<int?>(json['billerId']),
      userName: serializer.fromJson<String?>(json['userName']),
      userId: serializer.fromJson<int?>(json['userId']),
      isProvisioned: serializer.fromJson<bool>(json['isProvisioned']),
      terminalId: serializer.fromJson<int?>(json['terminalId']),
      terminalCode: serializer.fromJson<String?>(json['terminalCode']),
      terminalName: serializer.fromJson<String?>(json['terminalName']),
      posToken: serializer.fromJson<String?>(json['posToken']),
      clientToken: serializer.fromJson<String?>(json['clientToken']),
      activationToken: serializer.fromJson<String?>(json['activationToken']),
      macAddress: serializer.fromJson<String?>(json['macAddress']),
      posBaseUrl: serializer.fromJson<String?>(json['posBaseUrl']),
      deviceRegistered: serializer.fromJson<bool>(json['deviceRegistered']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'authToken': serializer.toJson<String?>(authToken),
      'deviceId': serializer.toJson<String?>(deviceId),
      'warehouseId': serializer.toJson<int?>(warehouseId),
      'customerId': serializer.toJson<int?>(customerId),
      'billerId': serializer.toJson<int?>(billerId),
      'userName': serializer.toJson<String?>(userName),
      'userId': serializer.toJson<int?>(userId),
      'isProvisioned': serializer.toJson<bool>(isProvisioned),
      'terminalId': serializer.toJson<int?>(terminalId),
      'terminalCode': serializer.toJson<String?>(terminalCode),
      'terminalName': serializer.toJson<String?>(terminalName),
      'posToken': serializer.toJson<String?>(posToken),
      'clientToken': serializer.toJson<String?>(clientToken),
      'activationToken': serializer.toJson<String?>(activationToken),
      'macAddress': serializer.toJson<String?>(macAddress),
      'posBaseUrl': serializer.toJson<String?>(posBaseUrl),
      'deviceRegistered': serializer.toJson<bool>(deviceRegistered),
    };
  }

  DeviceSessionData copyWith(
          {int? id,
          Value<String?> authToken = const Value.absent(),
          Value<String?> deviceId = const Value.absent(),
          Value<int?> warehouseId = const Value.absent(),
          Value<int?> customerId = const Value.absent(),
          Value<int?> billerId = const Value.absent(),
          Value<String?> userName = const Value.absent(),
          Value<int?> userId = const Value.absent(),
          bool? isProvisioned,
          Value<int?> terminalId = const Value.absent(),
          Value<String?> terminalCode = const Value.absent(),
          Value<String?> terminalName = const Value.absent(),
          Value<String?> posToken = const Value.absent(),
          Value<String?> clientToken = const Value.absent(),
          Value<String?> activationToken = const Value.absent(),
          Value<String?> macAddress = const Value.absent(),
          Value<String?> posBaseUrl = const Value.absent(),
          bool? deviceRegistered}) =>
      DeviceSessionData(
        id: id ?? this.id,
        authToken: authToken.present ? authToken.value : this.authToken,
        deviceId: deviceId.present ? deviceId.value : this.deviceId,
        warehouseId: warehouseId.present ? warehouseId.value : this.warehouseId,
        customerId: customerId.present ? customerId.value : this.customerId,
        billerId: billerId.present ? billerId.value : this.billerId,
        userName: userName.present ? userName.value : this.userName,
        userId: userId.present ? userId.value : this.userId,
        isProvisioned: isProvisioned ?? this.isProvisioned,
        terminalId: terminalId.present ? terminalId.value : this.terminalId,
        terminalCode:
            terminalCode.present ? terminalCode.value : this.terminalCode,
        terminalName:
            terminalName.present ? terminalName.value : this.terminalName,
        posToken: posToken.present ? posToken.value : this.posToken,
        clientToken: clientToken.present ? clientToken.value : this.clientToken,
        activationToken: activationToken.present
            ? activationToken.value
            : this.activationToken,
        macAddress: macAddress.present ? macAddress.value : this.macAddress,
        posBaseUrl: posBaseUrl.present ? posBaseUrl.value : this.posBaseUrl,
        deviceRegistered: deviceRegistered ?? this.deviceRegistered,
      );
  DeviceSessionData copyWithCompanion(DeviceSessionCompanion data) {
    return DeviceSessionData(
      id: data.id.present ? data.id.value : this.id,
      authToken: data.authToken.present ? data.authToken.value : this.authToken,
      deviceId: data.deviceId.present ? data.deviceId.value : this.deviceId,
      warehouseId:
          data.warehouseId.present ? data.warehouseId.value : this.warehouseId,
      customerId:
          data.customerId.present ? data.customerId.value : this.customerId,
      billerId: data.billerId.present ? data.billerId.value : this.billerId,
      userName: data.userName.present ? data.userName.value : this.userName,
      userId: data.userId.present ? data.userId.value : this.userId,
      isProvisioned: data.isProvisioned.present
          ? data.isProvisioned.value
          : this.isProvisioned,
      terminalId:
          data.terminalId.present ? data.terminalId.value : this.terminalId,
      terminalCode: data.terminalCode.present
          ? data.terminalCode.value
          : this.terminalCode,
      terminalName: data.terminalName.present
          ? data.terminalName.value
          : this.terminalName,
      posToken: data.posToken.present ? data.posToken.value : this.posToken,
      clientToken:
          data.clientToken.present ? data.clientToken.value : this.clientToken,
      activationToken: data.activationToken.present
          ? data.activationToken.value
          : this.activationToken,
      macAddress:
          data.macAddress.present ? data.macAddress.value : this.macAddress,
      posBaseUrl:
          data.posBaseUrl.present ? data.posBaseUrl.value : this.posBaseUrl,
      deviceRegistered: data.deviceRegistered.present
          ? data.deviceRegistered.value
          : this.deviceRegistered,
    );
  }

  @override
  String toString() {
    return (StringBuffer('DeviceSessionData(')
          ..write('id: $id, ')
          ..write('authToken: $authToken, ')
          ..write('deviceId: $deviceId, ')
          ..write('warehouseId: $warehouseId, ')
          ..write('customerId: $customerId, ')
          ..write('billerId: $billerId, ')
          ..write('userName: $userName, ')
          ..write('userId: $userId, ')
          ..write('isProvisioned: $isProvisioned, ')
          ..write('terminalId: $terminalId, ')
          ..write('terminalCode: $terminalCode, ')
          ..write('terminalName: $terminalName, ')
          ..write('posToken: $posToken, ')
          ..write('clientToken: $clientToken, ')
          ..write('activationToken: $activationToken, ')
          ..write('macAddress: $macAddress, ')
          ..write('posBaseUrl: $posBaseUrl, ')
          ..write('deviceRegistered: $deviceRegistered')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
      id,
      authToken,
      deviceId,
      warehouseId,
      customerId,
      billerId,
      userName,
      userId,
      isProvisioned,
      terminalId,
      terminalCode,
      terminalName,
      posToken,
      clientToken,
      activationToken,
      macAddress,
      posBaseUrl,
      deviceRegistered);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is DeviceSessionData &&
          other.id == this.id &&
          other.authToken == this.authToken &&
          other.deviceId == this.deviceId &&
          other.warehouseId == this.warehouseId &&
          other.customerId == this.customerId &&
          other.billerId == this.billerId &&
          other.userName == this.userName &&
          other.userId == this.userId &&
          other.isProvisioned == this.isProvisioned &&
          other.terminalId == this.terminalId &&
          other.terminalCode == this.terminalCode &&
          other.terminalName == this.terminalName &&
          other.posToken == this.posToken &&
          other.clientToken == this.clientToken &&
          other.activationToken == this.activationToken &&
          other.macAddress == this.macAddress &&
          other.posBaseUrl == this.posBaseUrl &&
          other.deviceRegistered == this.deviceRegistered);
}

class DeviceSessionCompanion extends UpdateCompanion<DeviceSessionData> {
  final Value<int> id;
  final Value<String?> authToken;
  final Value<String?> deviceId;
  final Value<int?> warehouseId;
  final Value<int?> customerId;
  final Value<int?> billerId;
  final Value<String?> userName;
  final Value<int?> userId;
  final Value<bool> isProvisioned;
  final Value<int?> terminalId;
  final Value<String?> terminalCode;
  final Value<String?> terminalName;
  final Value<String?> posToken;
  final Value<String?> clientToken;
  final Value<String?> activationToken;
  final Value<String?> macAddress;
  final Value<String?> posBaseUrl;
  final Value<bool> deviceRegistered;
  const DeviceSessionCompanion({
    this.id = const Value.absent(),
    this.authToken = const Value.absent(),
    this.deviceId = const Value.absent(),
    this.warehouseId = const Value.absent(),
    this.customerId = const Value.absent(),
    this.billerId = const Value.absent(),
    this.userName = const Value.absent(),
    this.userId = const Value.absent(),
    this.isProvisioned = const Value.absent(),
    this.terminalId = const Value.absent(),
    this.terminalCode = const Value.absent(),
    this.terminalName = const Value.absent(),
    this.posToken = const Value.absent(),
    this.clientToken = const Value.absent(),
    this.activationToken = const Value.absent(),
    this.macAddress = const Value.absent(),
    this.posBaseUrl = const Value.absent(),
    this.deviceRegistered = const Value.absent(),
  });
  DeviceSessionCompanion.insert({
    this.id = const Value.absent(),
    this.authToken = const Value.absent(),
    this.deviceId = const Value.absent(),
    this.warehouseId = const Value.absent(),
    this.customerId = const Value.absent(),
    this.billerId = const Value.absent(),
    this.userName = const Value.absent(),
    this.userId = const Value.absent(),
    this.isProvisioned = const Value.absent(),
    this.terminalId = const Value.absent(),
    this.terminalCode = const Value.absent(),
    this.terminalName = const Value.absent(),
    this.posToken = const Value.absent(),
    this.clientToken = const Value.absent(),
    this.activationToken = const Value.absent(),
    this.macAddress = const Value.absent(),
    this.posBaseUrl = const Value.absent(),
    this.deviceRegistered = const Value.absent(),
  });
  static Insertable<DeviceSessionData> custom({
    Expression<int>? id,
    Expression<String>? authToken,
    Expression<String>? deviceId,
    Expression<int>? warehouseId,
    Expression<int>? customerId,
    Expression<int>? billerId,
    Expression<String>? userName,
    Expression<int>? userId,
    Expression<bool>? isProvisioned,
    Expression<int>? terminalId,
    Expression<String>? terminalCode,
    Expression<String>? terminalName,
    Expression<String>? posToken,
    Expression<String>? clientToken,
    Expression<String>? activationToken,
    Expression<String>? macAddress,
    Expression<String>? posBaseUrl,
    Expression<bool>? deviceRegistered,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (authToken != null) 'auth_token': authToken,
      if (deviceId != null) 'device_id': deviceId,
      if (warehouseId != null) 'warehouse_id': warehouseId,
      if (customerId != null) 'customer_id': customerId,
      if (billerId != null) 'biller_id': billerId,
      if (userName != null) 'user_name': userName,
      if (userId != null) 'user_id': userId,
      if (isProvisioned != null) 'is_provisioned': isProvisioned,
      if (terminalId != null) 'terminal_id': terminalId,
      if (terminalCode != null) 'terminal_code': terminalCode,
      if (terminalName != null) 'terminal_name': terminalName,
      if (posToken != null) 'pos_token': posToken,
      if (clientToken != null) 'client_token': clientToken,
      if (activationToken != null) 'activation_token': activationToken,
      if (macAddress != null) 'mac_address': macAddress,
      if (posBaseUrl != null) 'pos_base_url': posBaseUrl,
      if (deviceRegistered != null) 'device_registered': deviceRegistered,
    });
  }

  DeviceSessionCompanion copyWith(
      {Value<int>? id,
      Value<String?>? authToken,
      Value<String?>? deviceId,
      Value<int?>? warehouseId,
      Value<int?>? customerId,
      Value<int?>? billerId,
      Value<String?>? userName,
      Value<int?>? userId,
      Value<bool>? isProvisioned,
      Value<int?>? terminalId,
      Value<String?>? terminalCode,
      Value<String?>? terminalName,
      Value<String?>? posToken,
      Value<String?>? clientToken,
      Value<String?>? activationToken,
      Value<String?>? macAddress,
      Value<String?>? posBaseUrl,
      Value<bool>? deviceRegistered}) {
    return DeviceSessionCompanion(
      id: id ?? this.id,
      authToken: authToken ?? this.authToken,
      deviceId: deviceId ?? this.deviceId,
      warehouseId: warehouseId ?? this.warehouseId,
      customerId: customerId ?? this.customerId,
      billerId: billerId ?? this.billerId,
      userName: userName ?? this.userName,
      userId: userId ?? this.userId,
      isProvisioned: isProvisioned ?? this.isProvisioned,
      terminalId: terminalId ?? this.terminalId,
      terminalCode: terminalCode ?? this.terminalCode,
      terminalName: terminalName ?? this.terminalName,
      posToken: posToken ?? this.posToken,
      clientToken: clientToken ?? this.clientToken,
      activationToken: activationToken ?? this.activationToken,
      macAddress: macAddress ?? this.macAddress,
      posBaseUrl: posBaseUrl ?? this.posBaseUrl,
      deviceRegistered: deviceRegistered ?? this.deviceRegistered,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (authToken.present) {
      map['auth_token'] = Variable<String>(authToken.value);
    }
    if (deviceId.present) {
      map['device_id'] = Variable<String>(deviceId.value);
    }
    if (warehouseId.present) {
      map['warehouse_id'] = Variable<int>(warehouseId.value);
    }
    if (customerId.present) {
      map['customer_id'] = Variable<int>(customerId.value);
    }
    if (billerId.present) {
      map['biller_id'] = Variable<int>(billerId.value);
    }
    if (userName.present) {
      map['user_name'] = Variable<String>(userName.value);
    }
    if (userId.present) {
      map['user_id'] = Variable<int>(userId.value);
    }
    if (isProvisioned.present) {
      map['is_provisioned'] = Variable<bool>(isProvisioned.value);
    }
    if (terminalId.present) {
      map['terminal_id'] = Variable<int>(terminalId.value);
    }
    if (terminalCode.present) {
      map['terminal_code'] = Variable<String>(terminalCode.value);
    }
    if (terminalName.present) {
      map['terminal_name'] = Variable<String>(terminalName.value);
    }
    if (posToken.present) {
      map['pos_token'] = Variable<String>(posToken.value);
    }
    if (clientToken.present) {
      map['client_token'] = Variable<String>(clientToken.value);
    }
    if (activationToken.present) {
      map['activation_token'] = Variable<String>(activationToken.value);
    }
    if (macAddress.present) {
      map['mac_address'] = Variable<String>(macAddress.value);
    }
    if (posBaseUrl.present) {
      map['pos_base_url'] = Variable<String>(posBaseUrl.value);
    }
    if (deviceRegistered.present) {
      map['device_registered'] = Variable<bool>(deviceRegistered.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('DeviceSessionCompanion(')
          ..write('id: $id, ')
          ..write('authToken: $authToken, ')
          ..write('deviceId: $deviceId, ')
          ..write('warehouseId: $warehouseId, ')
          ..write('customerId: $customerId, ')
          ..write('billerId: $billerId, ')
          ..write('userName: $userName, ')
          ..write('userId: $userId, ')
          ..write('isProvisioned: $isProvisioned, ')
          ..write('terminalId: $terminalId, ')
          ..write('terminalCode: $terminalCode, ')
          ..write('terminalName: $terminalName, ')
          ..write('posToken: $posToken, ')
          ..write('clientToken: $clientToken, ')
          ..write('activationToken: $activationToken, ')
          ..write('macAddress: $macAddress, ')
          ..write('posBaseUrl: $posBaseUrl, ')
          ..write('deviceRegistered: $deviceRegistered')
          ..write(')'))
        .toString();
  }
}

class $SyncMetaTable extends SyncMeta
    with TableInfo<$SyncMetaTable, SyncMetaData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $SyncMetaTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
      'id', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(1));
  static const VerificationMeta _deviceIdMeta =
      const VerificationMeta('deviceId');
  @override
  late final GeneratedColumn<String> deviceId = GeneratedColumn<String>(
      'device_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _warehouseIdMeta =
      const VerificationMeta('warehouseId');
  @override
  late final GeneratedColumn<int> warehouseId = GeneratedColumn<int>(
      'warehouse_id', aliasedName, false,
      type: DriftSqlType.int, requiredDuringInsert: true);
  static const VerificationMeta _lastCatalogSyncAtMeta =
      const VerificationMeta('lastCatalogSyncAt');
  @override
  late final GeneratedColumn<String> lastCatalogSyncAt =
      GeneratedColumn<String>('last_catalog_sync_at', aliasedName, true,
          type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _lastFullDownloadAtMeta =
      const VerificationMeta('lastFullDownloadAt');
  @override
  late final GeneratedColumn<String> lastFullDownloadAt =
      GeneratedColumn<String>('last_full_download_at', aliasedName, true,
          type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _defaultCustomerIdMeta =
      const VerificationMeta('defaultCustomerId');
  @override
  late final GeneratedColumn<int> defaultCustomerId = GeneratedColumn<int>(
      'default_customer_id', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _defaultBillerIdMeta =
      const VerificationMeta('defaultBillerId');
  @override
  late final GeneratedColumn<int> defaultBillerId = GeneratedColumn<int>(
      'default_biller_id', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _posSettingsJsonMeta =
      const VerificationMeta('posSettingsJson');
  @override
  late final GeneratedColumn<String> posSettingsJson = GeneratedColumn<String>(
      'pos_settings_json', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        deviceId,
        warehouseId,
        lastCatalogSyncAt,
        lastFullDownloadAt,
        defaultCustomerId,
        defaultBillerId,
        posSettingsJson
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'sync_meta';
  @override
  VerificationContext validateIntegrity(Insertable<SyncMetaData> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('device_id')) {
      context.handle(_deviceIdMeta,
          deviceId.isAcceptableOrUnknown(data['device_id']!, _deviceIdMeta));
    } else if (isInserting) {
      context.missing(_deviceIdMeta);
    }
    if (data.containsKey('warehouse_id')) {
      context.handle(
          _warehouseIdMeta,
          warehouseId.isAcceptableOrUnknown(
              data['warehouse_id']!, _warehouseIdMeta));
    } else if (isInserting) {
      context.missing(_warehouseIdMeta);
    }
    if (data.containsKey('last_catalog_sync_at')) {
      context.handle(
          _lastCatalogSyncAtMeta,
          lastCatalogSyncAt.isAcceptableOrUnknown(
              data['last_catalog_sync_at']!, _lastCatalogSyncAtMeta));
    }
    if (data.containsKey('last_full_download_at')) {
      context.handle(
          _lastFullDownloadAtMeta,
          lastFullDownloadAt.isAcceptableOrUnknown(
              data['last_full_download_at']!, _lastFullDownloadAtMeta));
    }
    if (data.containsKey('default_customer_id')) {
      context.handle(
          _defaultCustomerIdMeta,
          defaultCustomerId.isAcceptableOrUnknown(
              data['default_customer_id']!, _defaultCustomerIdMeta));
    }
    if (data.containsKey('default_biller_id')) {
      context.handle(
          _defaultBillerIdMeta,
          defaultBillerId.isAcceptableOrUnknown(
              data['default_biller_id']!, _defaultBillerIdMeta));
    }
    if (data.containsKey('pos_settings_json')) {
      context.handle(
          _posSettingsJsonMeta,
          posSettingsJson.isAcceptableOrUnknown(
              data['pos_settings_json']!, _posSettingsJsonMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  SyncMetaData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return SyncMetaData(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}id'])!,
      deviceId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}device_id'])!,
      warehouseId: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}warehouse_id'])!,
      lastCatalogSyncAt: attachedDatabase.typeMapping.read(
          DriftSqlType.string, data['${effectivePrefix}last_catalog_sync_at']),
      lastFullDownloadAt: attachedDatabase.typeMapping.read(
          DriftSqlType.string, data['${effectivePrefix}last_full_download_at']),
      defaultCustomerId: attachedDatabase.typeMapping.read(
          DriftSqlType.int, data['${effectivePrefix}default_customer_id']),
      defaultBillerId: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}default_biller_id']),
      posSettingsJson: attachedDatabase.typeMapping.read(
          DriftSqlType.string, data['${effectivePrefix}pos_settings_json']),
    );
  }

  @override
  $SyncMetaTable createAlias(String alias) {
    return $SyncMetaTable(attachedDatabase, alias);
  }
}

class SyncMetaData extends DataClass implements Insertable<SyncMetaData> {
  final int id;
  final String deviceId;
  final int warehouseId;
  final String? lastCatalogSyncAt;
  final String? lastFullDownloadAt;
  final int? defaultCustomerId;
  final int? defaultBillerId;
  final String? posSettingsJson;
  const SyncMetaData(
      {required this.id,
      required this.deviceId,
      required this.warehouseId,
      this.lastCatalogSyncAt,
      this.lastFullDownloadAt,
      this.defaultCustomerId,
      this.defaultBillerId,
      this.posSettingsJson});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['device_id'] = Variable<String>(deviceId);
    map['warehouse_id'] = Variable<int>(warehouseId);
    if (!nullToAbsent || lastCatalogSyncAt != null) {
      map['last_catalog_sync_at'] = Variable<String>(lastCatalogSyncAt);
    }
    if (!nullToAbsent || lastFullDownloadAt != null) {
      map['last_full_download_at'] = Variable<String>(lastFullDownloadAt);
    }
    if (!nullToAbsent || defaultCustomerId != null) {
      map['default_customer_id'] = Variable<int>(defaultCustomerId);
    }
    if (!nullToAbsent || defaultBillerId != null) {
      map['default_biller_id'] = Variable<int>(defaultBillerId);
    }
    if (!nullToAbsent || posSettingsJson != null) {
      map['pos_settings_json'] = Variable<String>(posSettingsJson);
    }
    return map;
  }

  SyncMetaCompanion toCompanion(bool nullToAbsent) {
    return SyncMetaCompanion(
      id: Value(id),
      deviceId: Value(deviceId),
      warehouseId: Value(warehouseId),
      lastCatalogSyncAt: lastCatalogSyncAt == null && nullToAbsent
          ? const Value.absent()
          : Value(lastCatalogSyncAt),
      lastFullDownloadAt: lastFullDownloadAt == null && nullToAbsent
          ? const Value.absent()
          : Value(lastFullDownloadAt),
      defaultCustomerId: defaultCustomerId == null && nullToAbsent
          ? const Value.absent()
          : Value(defaultCustomerId),
      defaultBillerId: defaultBillerId == null && nullToAbsent
          ? const Value.absent()
          : Value(defaultBillerId),
      posSettingsJson: posSettingsJson == null && nullToAbsent
          ? const Value.absent()
          : Value(posSettingsJson),
    );
  }

  factory SyncMetaData.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return SyncMetaData(
      id: serializer.fromJson<int>(json['id']),
      deviceId: serializer.fromJson<String>(json['deviceId']),
      warehouseId: serializer.fromJson<int>(json['warehouseId']),
      lastCatalogSyncAt:
          serializer.fromJson<String?>(json['lastCatalogSyncAt']),
      lastFullDownloadAt:
          serializer.fromJson<String?>(json['lastFullDownloadAt']),
      defaultCustomerId: serializer.fromJson<int?>(json['defaultCustomerId']),
      defaultBillerId: serializer.fromJson<int?>(json['defaultBillerId']),
      posSettingsJson: serializer.fromJson<String?>(json['posSettingsJson']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'deviceId': serializer.toJson<String>(deviceId),
      'warehouseId': serializer.toJson<int>(warehouseId),
      'lastCatalogSyncAt': serializer.toJson<String?>(lastCatalogSyncAt),
      'lastFullDownloadAt': serializer.toJson<String?>(lastFullDownloadAt),
      'defaultCustomerId': serializer.toJson<int?>(defaultCustomerId),
      'defaultBillerId': serializer.toJson<int?>(defaultBillerId),
      'posSettingsJson': serializer.toJson<String?>(posSettingsJson),
    };
  }

  SyncMetaData copyWith(
          {int? id,
          String? deviceId,
          int? warehouseId,
          Value<String?> lastCatalogSyncAt = const Value.absent(),
          Value<String?> lastFullDownloadAt = const Value.absent(),
          Value<int?> defaultCustomerId = const Value.absent(),
          Value<int?> defaultBillerId = const Value.absent(),
          Value<String?> posSettingsJson = const Value.absent()}) =>
      SyncMetaData(
        id: id ?? this.id,
        deviceId: deviceId ?? this.deviceId,
        warehouseId: warehouseId ?? this.warehouseId,
        lastCatalogSyncAt: lastCatalogSyncAt.present
            ? lastCatalogSyncAt.value
            : this.lastCatalogSyncAt,
        lastFullDownloadAt: lastFullDownloadAt.present
            ? lastFullDownloadAt.value
            : this.lastFullDownloadAt,
        defaultCustomerId: defaultCustomerId.present
            ? defaultCustomerId.value
            : this.defaultCustomerId,
        defaultBillerId: defaultBillerId.present
            ? defaultBillerId.value
            : this.defaultBillerId,
        posSettingsJson: posSettingsJson.present
            ? posSettingsJson.value
            : this.posSettingsJson,
      );
  SyncMetaData copyWithCompanion(SyncMetaCompanion data) {
    return SyncMetaData(
      id: data.id.present ? data.id.value : this.id,
      deviceId: data.deviceId.present ? data.deviceId.value : this.deviceId,
      warehouseId:
          data.warehouseId.present ? data.warehouseId.value : this.warehouseId,
      lastCatalogSyncAt: data.lastCatalogSyncAt.present
          ? data.lastCatalogSyncAt.value
          : this.lastCatalogSyncAt,
      lastFullDownloadAt: data.lastFullDownloadAt.present
          ? data.lastFullDownloadAt.value
          : this.lastFullDownloadAt,
      defaultCustomerId: data.defaultCustomerId.present
          ? data.defaultCustomerId.value
          : this.defaultCustomerId,
      defaultBillerId: data.defaultBillerId.present
          ? data.defaultBillerId.value
          : this.defaultBillerId,
      posSettingsJson: data.posSettingsJson.present
          ? data.posSettingsJson.value
          : this.posSettingsJson,
    );
  }

  @override
  String toString() {
    return (StringBuffer('SyncMetaData(')
          ..write('id: $id, ')
          ..write('deviceId: $deviceId, ')
          ..write('warehouseId: $warehouseId, ')
          ..write('lastCatalogSyncAt: $lastCatalogSyncAt, ')
          ..write('lastFullDownloadAt: $lastFullDownloadAt, ')
          ..write('defaultCustomerId: $defaultCustomerId, ')
          ..write('defaultBillerId: $defaultBillerId, ')
          ..write('posSettingsJson: $posSettingsJson')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, deviceId, warehouseId, lastCatalogSyncAt,
      lastFullDownloadAt, defaultCustomerId, defaultBillerId, posSettingsJson);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is SyncMetaData &&
          other.id == this.id &&
          other.deviceId == this.deviceId &&
          other.warehouseId == this.warehouseId &&
          other.lastCatalogSyncAt == this.lastCatalogSyncAt &&
          other.lastFullDownloadAt == this.lastFullDownloadAt &&
          other.defaultCustomerId == this.defaultCustomerId &&
          other.defaultBillerId == this.defaultBillerId &&
          other.posSettingsJson == this.posSettingsJson);
}

class SyncMetaCompanion extends UpdateCompanion<SyncMetaData> {
  final Value<int> id;
  final Value<String> deviceId;
  final Value<int> warehouseId;
  final Value<String?> lastCatalogSyncAt;
  final Value<String?> lastFullDownloadAt;
  final Value<int?> defaultCustomerId;
  final Value<int?> defaultBillerId;
  final Value<String?> posSettingsJson;
  const SyncMetaCompanion({
    this.id = const Value.absent(),
    this.deviceId = const Value.absent(),
    this.warehouseId = const Value.absent(),
    this.lastCatalogSyncAt = const Value.absent(),
    this.lastFullDownloadAt = const Value.absent(),
    this.defaultCustomerId = const Value.absent(),
    this.defaultBillerId = const Value.absent(),
    this.posSettingsJson = const Value.absent(),
  });
  SyncMetaCompanion.insert({
    this.id = const Value.absent(),
    required String deviceId,
    required int warehouseId,
    this.lastCatalogSyncAt = const Value.absent(),
    this.lastFullDownloadAt = const Value.absent(),
    this.defaultCustomerId = const Value.absent(),
    this.defaultBillerId = const Value.absent(),
    this.posSettingsJson = const Value.absent(),
  })  : deviceId = Value(deviceId),
        warehouseId = Value(warehouseId);
  static Insertable<SyncMetaData> custom({
    Expression<int>? id,
    Expression<String>? deviceId,
    Expression<int>? warehouseId,
    Expression<String>? lastCatalogSyncAt,
    Expression<String>? lastFullDownloadAt,
    Expression<int>? defaultCustomerId,
    Expression<int>? defaultBillerId,
    Expression<String>? posSettingsJson,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (deviceId != null) 'device_id': deviceId,
      if (warehouseId != null) 'warehouse_id': warehouseId,
      if (lastCatalogSyncAt != null) 'last_catalog_sync_at': lastCatalogSyncAt,
      if (lastFullDownloadAt != null)
        'last_full_download_at': lastFullDownloadAt,
      if (defaultCustomerId != null) 'default_customer_id': defaultCustomerId,
      if (defaultBillerId != null) 'default_biller_id': defaultBillerId,
      if (posSettingsJson != null) 'pos_settings_json': posSettingsJson,
    });
  }

  SyncMetaCompanion copyWith(
      {Value<int>? id,
      Value<String>? deviceId,
      Value<int>? warehouseId,
      Value<String?>? lastCatalogSyncAt,
      Value<String?>? lastFullDownloadAt,
      Value<int?>? defaultCustomerId,
      Value<int?>? defaultBillerId,
      Value<String?>? posSettingsJson}) {
    return SyncMetaCompanion(
      id: id ?? this.id,
      deviceId: deviceId ?? this.deviceId,
      warehouseId: warehouseId ?? this.warehouseId,
      lastCatalogSyncAt: lastCatalogSyncAt ?? this.lastCatalogSyncAt,
      lastFullDownloadAt: lastFullDownloadAt ?? this.lastFullDownloadAt,
      defaultCustomerId: defaultCustomerId ?? this.defaultCustomerId,
      defaultBillerId: defaultBillerId ?? this.defaultBillerId,
      posSettingsJson: posSettingsJson ?? this.posSettingsJson,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (deviceId.present) {
      map['device_id'] = Variable<String>(deviceId.value);
    }
    if (warehouseId.present) {
      map['warehouse_id'] = Variable<int>(warehouseId.value);
    }
    if (lastCatalogSyncAt.present) {
      map['last_catalog_sync_at'] = Variable<String>(lastCatalogSyncAt.value);
    }
    if (lastFullDownloadAt.present) {
      map['last_full_download_at'] = Variable<String>(lastFullDownloadAt.value);
    }
    if (defaultCustomerId.present) {
      map['default_customer_id'] = Variable<int>(defaultCustomerId.value);
    }
    if (defaultBillerId.present) {
      map['default_biller_id'] = Variable<int>(defaultBillerId.value);
    }
    if (posSettingsJson.present) {
      map['pos_settings_json'] = Variable<String>(posSettingsJson.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('SyncMetaCompanion(')
          ..write('id: $id, ')
          ..write('deviceId: $deviceId, ')
          ..write('warehouseId: $warehouseId, ')
          ..write('lastCatalogSyncAt: $lastCatalogSyncAt, ')
          ..write('lastFullDownloadAt: $lastFullDownloadAt, ')
          ..write('defaultCustomerId: $defaultCustomerId, ')
          ..write('defaultBillerId: $defaultBillerId, ')
          ..write('posSettingsJson: $posSettingsJson')
          ..write(')'))
        .toString();
  }
}

class $WarehousesTable extends Warehouses
    with TableInfo<$WarehousesTable, Warehouse> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $WarehousesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
      'id', aliasedName, false,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _nameMeta = const VerificationMeta('name');
  @override
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
      'name', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _phoneMeta = const VerificationMeta('phone');
  @override
  late final GeneratedColumn<String> phone = GeneratedColumn<String>(
      'phone', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _emailMeta = const VerificationMeta('email');
  @override
  late final GeneratedColumn<String> email = GeneratedColumn<String>(
      'email', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _addressMeta =
      const VerificationMeta('address');
  @override
  late final GeneratedColumn<String> address = GeneratedColumn<String>(
      'address', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _updatedAtMeta =
      const VerificationMeta('updatedAt');
  @override
  late final GeneratedColumn<String> updatedAt = GeneratedColumn<String>(
      'updated_at', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  @override
  List<GeneratedColumn> get $columns =>
      [id, name, phone, email, address, updatedAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'warehouses';
  @override
  VerificationContext validateIntegrity(Insertable<Warehouse> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('name')) {
      context.handle(
          _nameMeta, name.isAcceptableOrUnknown(data['name']!, _nameMeta));
    } else if (isInserting) {
      context.missing(_nameMeta);
    }
    if (data.containsKey('phone')) {
      context.handle(
          _phoneMeta, phone.isAcceptableOrUnknown(data['phone']!, _phoneMeta));
    }
    if (data.containsKey('email')) {
      context.handle(
          _emailMeta, email.isAcceptableOrUnknown(data['email']!, _emailMeta));
    }
    if (data.containsKey('address')) {
      context.handle(_addressMeta,
          address.isAcceptableOrUnknown(data['address']!, _addressMeta));
    }
    if (data.containsKey('updated_at')) {
      context.handle(_updatedAtMeta,
          updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  Warehouse map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return Warehouse(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}id'])!,
      name: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}name'])!,
      phone: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}phone']),
      email: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}email']),
      address: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}address']),
      updatedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}updated_at']),
    );
  }

  @override
  $WarehousesTable createAlias(String alias) {
    return $WarehousesTable(attachedDatabase, alias);
  }
}

class Warehouse extends DataClass implements Insertable<Warehouse> {
  final int id;
  final String name;
  final String? phone;
  final String? email;
  final String? address;
  final String? updatedAt;
  const Warehouse(
      {required this.id,
      required this.name,
      this.phone,
      this.email,
      this.address,
      this.updatedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['name'] = Variable<String>(name);
    if (!nullToAbsent || phone != null) {
      map['phone'] = Variable<String>(phone);
    }
    if (!nullToAbsent || email != null) {
      map['email'] = Variable<String>(email);
    }
    if (!nullToAbsent || address != null) {
      map['address'] = Variable<String>(address);
    }
    if (!nullToAbsent || updatedAt != null) {
      map['updated_at'] = Variable<String>(updatedAt);
    }
    return map;
  }

  WarehousesCompanion toCompanion(bool nullToAbsent) {
    return WarehousesCompanion(
      id: Value(id),
      name: Value(name),
      phone:
          phone == null && nullToAbsent ? const Value.absent() : Value(phone),
      email:
          email == null && nullToAbsent ? const Value.absent() : Value(email),
      address: address == null && nullToAbsent
          ? const Value.absent()
          : Value(address),
      updatedAt: updatedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(updatedAt),
    );
  }

  factory Warehouse.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return Warehouse(
      id: serializer.fromJson<int>(json['id']),
      name: serializer.fromJson<String>(json['name']),
      phone: serializer.fromJson<String?>(json['phone']),
      email: serializer.fromJson<String?>(json['email']),
      address: serializer.fromJson<String?>(json['address']),
      updatedAt: serializer.fromJson<String?>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'name': serializer.toJson<String>(name),
      'phone': serializer.toJson<String?>(phone),
      'email': serializer.toJson<String?>(email),
      'address': serializer.toJson<String?>(address),
      'updatedAt': serializer.toJson<String?>(updatedAt),
    };
  }

  Warehouse copyWith(
          {int? id,
          String? name,
          Value<String?> phone = const Value.absent(),
          Value<String?> email = const Value.absent(),
          Value<String?> address = const Value.absent(),
          Value<String?> updatedAt = const Value.absent()}) =>
      Warehouse(
        id: id ?? this.id,
        name: name ?? this.name,
        phone: phone.present ? phone.value : this.phone,
        email: email.present ? email.value : this.email,
        address: address.present ? address.value : this.address,
        updatedAt: updatedAt.present ? updatedAt.value : this.updatedAt,
      );
  Warehouse copyWithCompanion(WarehousesCompanion data) {
    return Warehouse(
      id: data.id.present ? data.id.value : this.id,
      name: data.name.present ? data.name.value : this.name,
      phone: data.phone.present ? data.phone.value : this.phone,
      email: data.email.present ? data.email.value : this.email,
      address: data.address.present ? data.address.value : this.address,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('Warehouse(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('phone: $phone, ')
          ..write('email: $email, ')
          ..write('address: $address, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, name, phone, email, address, updatedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Warehouse &&
          other.id == this.id &&
          other.name == this.name &&
          other.phone == this.phone &&
          other.email == this.email &&
          other.address == this.address &&
          other.updatedAt == this.updatedAt);
}

class WarehousesCompanion extends UpdateCompanion<Warehouse> {
  final Value<int> id;
  final Value<String> name;
  final Value<String?> phone;
  final Value<String?> email;
  final Value<String?> address;
  final Value<String?> updatedAt;
  const WarehousesCompanion({
    this.id = const Value.absent(),
    this.name = const Value.absent(),
    this.phone = const Value.absent(),
    this.email = const Value.absent(),
    this.address = const Value.absent(),
    this.updatedAt = const Value.absent(),
  });
  WarehousesCompanion.insert({
    this.id = const Value.absent(),
    required String name,
    this.phone = const Value.absent(),
    this.email = const Value.absent(),
    this.address = const Value.absent(),
    this.updatedAt = const Value.absent(),
  }) : name = Value(name);
  static Insertable<Warehouse> custom({
    Expression<int>? id,
    Expression<String>? name,
    Expression<String>? phone,
    Expression<String>? email,
    Expression<String>? address,
    Expression<String>? updatedAt,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (name != null) 'name': name,
      if (phone != null) 'phone': phone,
      if (email != null) 'email': email,
      if (address != null) 'address': address,
      if (updatedAt != null) 'updated_at': updatedAt,
    });
  }

  WarehousesCompanion copyWith(
      {Value<int>? id,
      Value<String>? name,
      Value<String?>? phone,
      Value<String?>? email,
      Value<String?>? address,
      Value<String?>? updatedAt}) {
    return WarehousesCompanion(
      id: id ?? this.id,
      name: name ?? this.name,
      phone: phone ?? this.phone,
      email: email ?? this.email,
      address: address ?? this.address,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (phone.present) {
      map['phone'] = Variable<String>(phone.value);
    }
    if (email.present) {
      map['email'] = Variable<String>(email.value);
    }
    if (address.present) {
      map['address'] = Variable<String>(address.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<String>(updatedAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('WarehousesCompanion(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('phone: $phone, ')
          ..write('email: $email, ')
          ..write('address: $address, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }
}

class $LocalUsersTable extends LocalUsers
    with TableInfo<$LocalUsersTable, LocalUser> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalUsersTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
      'id', aliasedName, false,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _nameMeta = const VerificationMeta('name');
  @override
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
      'name', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _usernameMeta =
      const VerificationMeta('username');
  @override
  late final GeneratedColumn<String> username = GeneratedColumn<String>(
      'username', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _emailMeta = const VerificationMeta('email');
  @override
  late final GeneratedColumn<String> email = GeneratedColumn<String>(
      'email', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _passwordHashMeta =
      const VerificationMeta('passwordHash');
  @override
  late final GeneratedColumn<String> passwordHash = GeneratedColumn<String>(
      'password_hash', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _accessPinHashMeta =
      const VerificationMeta('accessPinHash');
  @override
  late final GeneratedColumn<String> accessPinHash = GeneratedColumn<String>(
      'access_pin_hash', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _warehouseIdMeta =
      const VerificationMeta('warehouseId');
  @override
  late final GeneratedColumn<int> warehouseId = GeneratedColumn<int>(
      'warehouse_id', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _roleIdMeta = const VerificationMeta('roleId');
  @override
  late final GeneratedColumn<int> roleId = GeneratedColumn<int>(
      'role_id', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _billerIdMeta =
      const VerificationMeta('billerId');
  @override
  late final GeneratedColumn<int> billerId = GeneratedColumn<int>(
      'biller_id', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _updatedAtMeta =
      const VerificationMeta('updatedAt');
  @override
  late final GeneratedColumn<String> updatedAt = GeneratedColumn<String>(
      'updated_at', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        name,
        username,
        email,
        passwordHash,
        accessPinHash,
        warehouseId,
        roleId,
        billerId,
        updatedAt
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_users';
  @override
  VerificationContext validateIntegrity(Insertable<LocalUser> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('name')) {
      context.handle(
          _nameMeta, name.isAcceptableOrUnknown(data['name']!, _nameMeta));
    } else if (isInserting) {
      context.missing(_nameMeta);
    }
    if (data.containsKey('username')) {
      context.handle(_usernameMeta,
          username.isAcceptableOrUnknown(data['username']!, _usernameMeta));
    }
    if (data.containsKey('email')) {
      context.handle(
          _emailMeta, email.isAcceptableOrUnknown(data['email']!, _emailMeta));
    }
    if (data.containsKey('password_hash')) {
      context.handle(
          _passwordHashMeta,
          passwordHash.isAcceptableOrUnknown(
              data['password_hash']!, _passwordHashMeta));
    } else if (isInserting) {
      context.missing(_passwordHashMeta);
    }
    if (data.containsKey('access_pin_hash')) {
      context.handle(
          _accessPinHashMeta,
          accessPinHash.isAcceptableOrUnknown(
              data['access_pin_hash']!, _accessPinHashMeta));
    }
    if (data.containsKey('warehouse_id')) {
      context.handle(
          _warehouseIdMeta,
          warehouseId.isAcceptableOrUnknown(
              data['warehouse_id']!, _warehouseIdMeta));
    }
    if (data.containsKey('role_id')) {
      context.handle(_roleIdMeta,
          roleId.isAcceptableOrUnknown(data['role_id']!, _roleIdMeta));
    }
    if (data.containsKey('biller_id')) {
      context.handle(_billerIdMeta,
          billerId.isAcceptableOrUnknown(data['biller_id']!, _billerIdMeta));
    }
    if (data.containsKey('updated_at')) {
      context.handle(_updatedAtMeta,
          updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalUser map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalUser(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}id'])!,
      name: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}name'])!,
      username: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}username']),
      email: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}email']),
      passwordHash: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}password_hash'])!,
      accessPinHash: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}access_pin_hash']),
      warehouseId: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}warehouse_id']),
      roleId: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}role_id']),
      billerId: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}biller_id']),
      updatedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}updated_at']),
    );
  }

  @override
  $LocalUsersTable createAlias(String alias) {
    return $LocalUsersTable(attachedDatabase, alias);
  }
}

class LocalUser extends DataClass implements Insertable<LocalUser> {
  final int id;
  final String name;
  final String? username;
  final String? email;
  final String passwordHash;
  final String? accessPinHash;
  final int? warehouseId;
  final int? roleId;
  final int? billerId;
  final String? updatedAt;
  const LocalUser(
      {required this.id,
      required this.name,
      this.username,
      this.email,
      required this.passwordHash,
      this.accessPinHash,
      this.warehouseId,
      this.roleId,
      this.billerId,
      this.updatedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['name'] = Variable<String>(name);
    if (!nullToAbsent || username != null) {
      map['username'] = Variable<String>(username);
    }
    if (!nullToAbsent || email != null) {
      map['email'] = Variable<String>(email);
    }
    map['password_hash'] = Variable<String>(passwordHash);
    if (!nullToAbsent || accessPinHash != null) {
      map['access_pin_hash'] = Variable<String>(accessPinHash);
    }
    if (!nullToAbsent || warehouseId != null) {
      map['warehouse_id'] = Variable<int>(warehouseId);
    }
    if (!nullToAbsent || roleId != null) {
      map['role_id'] = Variable<int>(roleId);
    }
    if (!nullToAbsent || billerId != null) {
      map['biller_id'] = Variable<int>(billerId);
    }
    if (!nullToAbsent || updatedAt != null) {
      map['updated_at'] = Variable<String>(updatedAt);
    }
    return map;
  }

  LocalUsersCompanion toCompanion(bool nullToAbsent) {
    return LocalUsersCompanion(
      id: Value(id),
      name: Value(name),
      username: username == null && nullToAbsent
          ? const Value.absent()
          : Value(username),
      email:
          email == null && nullToAbsent ? const Value.absent() : Value(email),
      passwordHash: Value(passwordHash),
      accessPinHash: accessPinHash == null && nullToAbsent
          ? const Value.absent()
          : Value(accessPinHash),
      warehouseId: warehouseId == null && nullToAbsent
          ? const Value.absent()
          : Value(warehouseId),
      roleId:
          roleId == null && nullToAbsent ? const Value.absent() : Value(roleId),
      billerId: billerId == null && nullToAbsent
          ? const Value.absent()
          : Value(billerId),
      updatedAt: updatedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(updatedAt),
    );
  }

  factory LocalUser.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalUser(
      id: serializer.fromJson<int>(json['id']),
      name: serializer.fromJson<String>(json['name']),
      username: serializer.fromJson<String?>(json['username']),
      email: serializer.fromJson<String?>(json['email']),
      passwordHash: serializer.fromJson<String>(json['passwordHash']),
      accessPinHash: serializer.fromJson<String?>(json['accessPinHash']),
      warehouseId: serializer.fromJson<int?>(json['warehouseId']),
      roleId: serializer.fromJson<int?>(json['roleId']),
      billerId: serializer.fromJson<int?>(json['billerId']),
      updatedAt: serializer.fromJson<String?>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'name': serializer.toJson<String>(name),
      'username': serializer.toJson<String?>(username),
      'email': serializer.toJson<String?>(email),
      'passwordHash': serializer.toJson<String>(passwordHash),
      'accessPinHash': serializer.toJson<String?>(accessPinHash),
      'warehouseId': serializer.toJson<int?>(warehouseId),
      'roleId': serializer.toJson<int?>(roleId),
      'billerId': serializer.toJson<int?>(billerId),
      'updatedAt': serializer.toJson<String?>(updatedAt),
    };
  }

  LocalUser copyWith(
          {int? id,
          String? name,
          Value<String?> username = const Value.absent(),
          Value<String?> email = const Value.absent(),
          String? passwordHash,
          Value<String?> accessPinHash = const Value.absent(),
          Value<int?> warehouseId = const Value.absent(),
          Value<int?> roleId = const Value.absent(),
          Value<int?> billerId = const Value.absent(),
          Value<String?> updatedAt = const Value.absent()}) =>
      LocalUser(
        id: id ?? this.id,
        name: name ?? this.name,
        username: username.present ? username.value : this.username,
        email: email.present ? email.value : this.email,
        passwordHash: passwordHash ?? this.passwordHash,
        accessPinHash:
            accessPinHash.present ? accessPinHash.value : this.accessPinHash,
        warehouseId: warehouseId.present ? warehouseId.value : this.warehouseId,
        roleId: roleId.present ? roleId.value : this.roleId,
        billerId: billerId.present ? billerId.value : this.billerId,
        updatedAt: updatedAt.present ? updatedAt.value : this.updatedAt,
      );
  LocalUser copyWithCompanion(LocalUsersCompanion data) {
    return LocalUser(
      id: data.id.present ? data.id.value : this.id,
      name: data.name.present ? data.name.value : this.name,
      username: data.username.present ? data.username.value : this.username,
      email: data.email.present ? data.email.value : this.email,
      passwordHash: data.passwordHash.present
          ? data.passwordHash.value
          : this.passwordHash,
      accessPinHash: data.accessPinHash.present
          ? data.accessPinHash.value
          : this.accessPinHash,
      warehouseId:
          data.warehouseId.present ? data.warehouseId.value : this.warehouseId,
      roleId: data.roleId.present ? data.roleId.value : this.roleId,
      billerId: data.billerId.present ? data.billerId.value : this.billerId,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalUser(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('username: $username, ')
          ..write('email: $email, ')
          ..write('passwordHash: $passwordHash, ')
          ..write('accessPinHash: $accessPinHash, ')
          ..write('warehouseId: $warehouseId, ')
          ..write('roleId: $roleId, ')
          ..write('billerId: $billerId, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, name, username, email, passwordHash,
      accessPinHash, warehouseId, roleId, billerId, updatedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalUser &&
          other.id == this.id &&
          other.name == this.name &&
          other.username == this.username &&
          other.email == this.email &&
          other.passwordHash == this.passwordHash &&
          other.accessPinHash == this.accessPinHash &&
          other.warehouseId == this.warehouseId &&
          other.roleId == this.roleId &&
          other.billerId == this.billerId &&
          other.updatedAt == this.updatedAt);
}

class LocalUsersCompanion extends UpdateCompanion<LocalUser> {
  final Value<int> id;
  final Value<String> name;
  final Value<String?> username;
  final Value<String?> email;
  final Value<String> passwordHash;
  final Value<String?> accessPinHash;
  final Value<int?> warehouseId;
  final Value<int?> roleId;
  final Value<int?> billerId;
  final Value<String?> updatedAt;
  const LocalUsersCompanion({
    this.id = const Value.absent(),
    this.name = const Value.absent(),
    this.username = const Value.absent(),
    this.email = const Value.absent(),
    this.passwordHash = const Value.absent(),
    this.accessPinHash = const Value.absent(),
    this.warehouseId = const Value.absent(),
    this.roleId = const Value.absent(),
    this.billerId = const Value.absent(),
    this.updatedAt = const Value.absent(),
  });
  LocalUsersCompanion.insert({
    this.id = const Value.absent(),
    required String name,
    this.username = const Value.absent(),
    this.email = const Value.absent(),
    required String passwordHash,
    this.accessPinHash = const Value.absent(),
    this.warehouseId = const Value.absent(),
    this.roleId = const Value.absent(),
    this.billerId = const Value.absent(),
    this.updatedAt = const Value.absent(),
  })  : name = Value(name),
        passwordHash = Value(passwordHash);
  static Insertable<LocalUser> custom({
    Expression<int>? id,
    Expression<String>? name,
    Expression<String>? username,
    Expression<String>? email,
    Expression<String>? passwordHash,
    Expression<String>? accessPinHash,
    Expression<int>? warehouseId,
    Expression<int>? roleId,
    Expression<int>? billerId,
    Expression<String>? updatedAt,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (name != null) 'name': name,
      if (username != null) 'username': username,
      if (email != null) 'email': email,
      if (passwordHash != null) 'password_hash': passwordHash,
      if (accessPinHash != null) 'access_pin_hash': accessPinHash,
      if (warehouseId != null) 'warehouse_id': warehouseId,
      if (roleId != null) 'role_id': roleId,
      if (billerId != null) 'biller_id': billerId,
      if (updatedAt != null) 'updated_at': updatedAt,
    });
  }

  LocalUsersCompanion copyWith(
      {Value<int>? id,
      Value<String>? name,
      Value<String?>? username,
      Value<String?>? email,
      Value<String>? passwordHash,
      Value<String?>? accessPinHash,
      Value<int?>? warehouseId,
      Value<int?>? roleId,
      Value<int?>? billerId,
      Value<String?>? updatedAt}) {
    return LocalUsersCompanion(
      id: id ?? this.id,
      name: name ?? this.name,
      username: username ?? this.username,
      email: email ?? this.email,
      passwordHash: passwordHash ?? this.passwordHash,
      accessPinHash: accessPinHash ?? this.accessPinHash,
      warehouseId: warehouseId ?? this.warehouseId,
      roleId: roleId ?? this.roleId,
      billerId: billerId ?? this.billerId,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (username.present) {
      map['username'] = Variable<String>(username.value);
    }
    if (email.present) {
      map['email'] = Variable<String>(email.value);
    }
    if (passwordHash.present) {
      map['password_hash'] = Variable<String>(passwordHash.value);
    }
    if (accessPinHash.present) {
      map['access_pin_hash'] = Variable<String>(accessPinHash.value);
    }
    if (warehouseId.present) {
      map['warehouse_id'] = Variable<int>(warehouseId.value);
    }
    if (roleId.present) {
      map['role_id'] = Variable<int>(roleId.value);
    }
    if (billerId.present) {
      map['biller_id'] = Variable<int>(billerId.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<String>(updatedAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalUsersCompanion(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('username: $username, ')
          ..write('email: $email, ')
          ..write('passwordHash: $passwordHash, ')
          ..write('accessPinHash: $accessPinHash, ')
          ..write('warehouseId: $warehouseId, ')
          ..write('roleId: $roleId, ')
          ..write('billerId: $billerId, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }
}

class $CategoriesTable extends Categories
    with TableInfo<$CategoriesTable, Category> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $CategoriesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
      'id', aliasedName, false,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _nameMeta = const VerificationMeta('name');
  @override
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
      'name', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _imageMeta = const VerificationMeta('image');
  @override
  late final GeneratedColumn<String> image = GeneratedColumn<String>(
      'image', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _updatedAtMeta =
      const VerificationMeta('updatedAt');
  @override
  late final GeneratedColumn<String> updatedAt = GeneratedColumn<String>(
      'updated_at', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  @override
  List<GeneratedColumn> get $columns => [id, name, image, updatedAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'categories';
  @override
  VerificationContext validateIntegrity(Insertable<Category> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('name')) {
      context.handle(
          _nameMeta, name.isAcceptableOrUnknown(data['name']!, _nameMeta));
    } else if (isInserting) {
      context.missing(_nameMeta);
    }
    if (data.containsKey('image')) {
      context.handle(
          _imageMeta, image.isAcceptableOrUnknown(data['image']!, _imageMeta));
    }
    if (data.containsKey('updated_at')) {
      context.handle(_updatedAtMeta,
          updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  Category map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return Category(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}id'])!,
      name: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}name'])!,
      image: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}image']),
      updatedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}updated_at']),
    );
  }

  @override
  $CategoriesTable createAlias(String alias) {
    return $CategoriesTable(attachedDatabase, alias);
  }
}

class Category extends DataClass implements Insertable<Category> {
  final int id;
  final String name;
  final String? image;
  final String? updatedAt;
  const Category(
      {required this.id, required this.name, this.image, this.updatedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['name'] = Variable<String>(name);
    if (!nullToAbsent || image != null) {
      map['image'] = Variable<String>(image);
    }
    if (!nullToAbsent || updatedAt != null) {
      map['updated_at'] = Variable<String>(updatedAt);
    }
    return map;
  }

  CategoriesCompanion toCompanion(bool nullToAbsent) {
    return CategoriesCompanion(
      id: Value(id),
      name: Value(name),
      image:
          image == null && nullToAbsent ? const Value.absent() : Value(image),
      updatedAt: updatedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(updatedAt),
    );
  }

  factory Category.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return Category(
      id: serializer.fromJson<int>(json['id']),
      name: serializer.fromJson<String>(json['name']),
      image: serializer.fromJson<String?>(json['image']),
      updatedAt: serializer.fromJson<String?>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'name': serializer.toJson<String>(name),
      'image': serializer.toJson<String?>(image),
      'updatedAt': serializer.toJson<String?>(updatedAt),
    };
  }

  Category copyWith(
          {int? id,
          String? name,
          Value<String?> image = const Value.absent(),
          Value<String?> updatedAt = const Value.absent()}) =>
      Category(
        id: id ?? this.id,
        name: name ?? this.name,
        image: image.present ? image.value : this.image,
        updatedAt: updatedAt.present ? updatedAt.value : this.updatedAt,
      );
  Category copyWithCompanion(CategoriesCompanion data) {
    return Category(
      id: data.id.present ? data.id.value : this.id,
      name: data.name.present ? data.name.value : this.name,
      image: data.image.present ? data.image.value : this.image,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('Category(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('image: $image, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, name, image, updatedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Category &&
          other.id == this.id &&
          other.name == this.name &&
          other.image == this.image &&
          other.updatedAt == this.updatedAt);
}

class CategoriesCompanion extends UpdateCompanion<Category> {
  final Value<int> id;
  final Value<String> name;
  final Value<String?> image;
  final Value<String?> updatedAt;
  const CategoriesCompanion({
    this.id = const Value.absent(),
    this.name = const Value.absent(),
    this.image = const Value.absent(),
    this.updatedAt = const Value.absent(),
  });
  CategoriesCompanion.insert({
    this.id = const Value.absent(),
    required String name,
    this.image = const Value.absent(),
    this.updatedAt = const Value.absent(),
  }) : name = Value(name);
  static Insertable<Category> custom({
    Expression<int>? id,
    Expression<String>? name,
    Expression<String>? image,
    Expression<String>? updatedAt,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (name != null) 'name': name,
      if (image != null) 'image': image,
      if (updatedAt != null) 'updated_at': updatedAt,
    });
  }

  CategoriesCompanion copyWith(
      {Value<int>? id,
      Value<String>? name,
      Value<String?>? image,
      Value<String?>? updatedAt}) {
    return CategoriesCompanion(
      id: id ?? this.id,
      name: name ?? this.name,
      image: image ?? this.image,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (image.present) {
      map['image'] = Variable<String>(image.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<String>(updatedAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('CategoriesCompanion(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('image: $image, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }
}

class $BrandsTable extends Brands with TableInfo<$BrandsTable, Brand> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $BrandsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
      'id', aliasedName, false,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _nameMeta = const VerificationMeta('name');
  @override
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
      'name', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _imageMeta = const VerificationMeta('image');
  @override
  late final GeneratedColumn<String> image = GeneratedColumn<String>(
      'image', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _updatedAtMeta =
      const VerificationMeta('updatedAt');
  @override
  late final GeneratedColumn<String> updatedAt = GeneratedColumn<String>(
      'updated_at', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  @override
  List<GeneratedColumn> get $columns => [id, name, image, updatedAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'brands';
  @override
  VerificationContext validateIntegrity(Insertable<Brand> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('name')) {
      context.handle(
          _nameMeta, name.isAcceptableOrUnknown(data['name']!, _nameMeta));
    } else if (isInserting) {
      context.missing(_nameMeta);
    }
    if (data.containsKey('image')) {
      context.handle(
          _imageMeta, image.isAcceptableOrUnknown(data['image']!, _imageMeta));
    }
    if (data.containsKey('updated_at')) {
      context.handle(_updatedAtMeta,
          updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  Brand map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return Brand(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}id'])!,
      name: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}name'])!,
      image: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}image']),
      updatedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}updated_at']),
    );
  }

  @override
  $BrandsTable createAlias(String alias) {
    return $BrandsTable(attachedDatabase, alias);
  }
}

class Brand extends DataClass implements Insertable<Brand> {
  final int id;
  final String name;
  final String? image;
  final String? updatedAt;
  const Brand(
      {required this.id, required this.name, this.image, this.updatedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['name'] = Variable<String>(name);
    if (!nullToAbsent || image != null) {
      map['image'] = Variable<String>(image);
    }
    if (!nullToAbsent || updatedAt != null) {
      map['updated_at'] = Variable<String>(updatedAt);
    }
    return map;
  }

  BrandsCompanion toCompanion(bool nullToAbsent) {
    return BrandsCompanion(
      id: Value(id),
      name: Value(name),
      image:
          image == null && nullToAbsent ? const Value.absent() : Value(image),
      updatedAt: updatedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(updatedAt),
    );
  }

  factory Brand.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return Brand(
      id: serializer.fromJson<int>(json['id']),
      name: serializer.fromJson<String>(json['name']),
      image: serializer.fromJson<String?>(json['image']),
      updatedAt: serializer.fromJson<String?>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'name': serializer.toJson<String>(name),
      'image': serializer.toJson<String?>(image),
      'updatedAt': serializer.toJson<String?>(updatedAt),
    };
  }

  Brand copyWith(
          {int? id,
          String? name,
          Value<String?> image = const Value.absent(),
          Value<String?> updatedAt = const Value.absent()}) =>
      Brand(
        id: id ?? this.id,
        name: name ?? this.name,
        image: image.present ? image.value : this.image,
        updatedAt: updatedAt.present ? updatedAt.value : this.updatedAt,
      );
  Brand copyWithCompanion(BrandsCompanion data) {
    return Brand(
      id: data.id.present ? data.id.value : this.id,
      name: data.name.present ? data.name.value : this.name,
      image: data.image.present ? data.image.value : this.image,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('Brand(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('image: $image, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, name, image, updatedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Brand &&
          other.id == this.id &&
          other.name == this.name &&
          other.image == this.image &&
          other.updatedAt == this.updatedAt);
}

class BrandsCompanion extends UpdateCompanion<Brand> {
  final Value<int> id;
  final Value<String> name;
  final Value<String?> image;
  final Value<String?> updatedAt;
  const BrandsCompanion({
    this.id = const Value.absent(),
    this.name = const Value.absent(),
    this.image = const Value.absent(),
    this.updatedAt = const Value.absent(),
  });
  BrandsCompanion.insert({
    this.id = const Value.absent(),
    required String name,
    this.image = const Value.absent(),
    this.updatedAt = const Value.absent(),
  }) : name = Value(name);
  static Insertable<Brand> custom({
    Expression<int>? id,
    Expression<String>? name,
    Expression<String>? image,
    Expression<String>? updatedAt,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (name != null) 'name': name,
      if (image != null) 'image': image,
      if (updatedAt != null) 'updated_at': updatedAt,
    });
  }

  BrandsCompanion copyWith(
      {Value<int>? id,
      Value<String>? name,
      Value<String?>? image,
      Value<String?>? updatedAt}) {
    return BrandsCompanion(
      id: id ?? this.id,
      name: name ?? this.name,
      image: image ?? this.image,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (image.present) {
      map['image'] = Variable<String>(image.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<String>(updatedAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('BrandsCompanion(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('image: $image, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }
}

class $TaxesTable extends Taxes with TableInfo<$TaxesTable, Taxe> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $TaxesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
      'id', aliasedName, false,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _nameMeta = const VerificationMeta('name');
  @override
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
      'name', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _rateMeta = const VerificationMeta('rate');
  @override
  late final GeneratedColumn<double> rate = GeneratedColumn<double>(
      'rate', aliasedName, false,
      type: DriftSqlType.double,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _updatedAtMeta =
      const VerificationMeta('updatedAt');
  @override
  late final GeneratedColumn<String> updatedAt = GeneratedColumn<String>(
      'updated_at', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  @override
  List<GeneratedColumn> get $columns => [id, name, rate, updatedAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'taxes';
  @override
  VerificationContext validateIntegrity(Insertable<Taxe> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('name')) {
      context.handle(
          _nameMeta, name.isAcceptableOrUnknown(data['name']!, _nameMeta));
    } else if (isInserting) {
      context.missing(_nameMeta);
    }
    if (data.containsKey('rate')) {
      context.handle(
          _rateMeta, rate.isAcceptableOrUnknown(data['rate']!, _rateMeta));
    }
    if (data.containsKey('updated_at')) {
      context.handle(_updatedAtMeta,
          updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  Taxe map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return Taxe(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}id'])!,
      name: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}name'])!,
      rate: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}rate'])!,
      updatedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}updated_at']),
    );
  }

  @override
  $TaxesTable createAlias(String alias) {
    return $TaxesTable(attachedDatabase, alias);
  }
}

class Taxe extends DataClass implements Insertable<Taxe> {
  final int id;
  final String name;
  final double rate;
  final String? updatedAt;
  const Taxe(
      {required this.id,
      required this.name,
      required this.rate,
      this.updatedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['name'] = Variable<String>(name);
    map['rate'] = Variable<double>(rate);
    if (!nullToAbsent || updatedAt != null) {
      map['updated_at'] = Variable<String>(updatedAt);
    }
    return map;
  }

  TaxesCompanion toCompanion(bool nullToAbsent) {
    return TaxesCompanion(
      id: Value(id),
      name: Value(name),
      rate: Value(rate),
      updatedAt: updatedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(updatedAt),
    );
  }

  factory Taxe.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return Taxe(
      id: serializer.fromJson<int>(json['id']),
      name: serializer.fromJson<String>(json['name']),
      rate: serializer.fromJson<double>(json['rate']),
      updatedAt: serializer.fromJson<String?>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'name': serializer.toJson<String>(name),
      'rate': serializer.toJson<double>(rate),
      'updatedAt': serializer.toJson<String?>(updatedAt),
    };
  }

  Taxe copyWith(
          {int? id,
          String? name,
          double? rate,
          Value<String?> updatedAt = const Value.absent()}) =>
      Taxe(
        id: id ?? this.id,
        name: name ?? this.name,
        rate: rate ?? this.rate,
        updatedAt: updatedAt.present ? updatedAt.value : this.updatedAt,
      );
  Taxe copyWithCompanion(TaxesCompanion data) {
    return Taxe(
      id: data.id.present ? data.id.value : this.id,
      name: data.name.present ? data.name.value : this.name,
      rate: data.rate.present ? data.rate.value : this.rate,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('Taxe(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('rate: $rate, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, name, rate, updatedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Taxe &&
          other.id == this.id &&
          other.name == this.name &&
          other.rate == this.rate &&
          other.updatedAt == this.updatedAt);
}

class TaxesCompanion extends UpdateCompanion<Taxe> {
  final Value<int> id;
  final Value<String> name;
  final Value<double> rate;
  final Value<String?> updatedAt;
  const TaxesCompanion({
    this.id = const Value.absent(),
    this.name = const Value.absent(),
    this.rate = const Value.absent(),
    this.updatedAt = const Value.absent(),
  });
  TaxesCompanion.insert({
    this.id = const Value.absent(),
    required String name,
    this.rate = const Value.absent(),
    this.updatedAt = const Value.absent(),
  }) : name = Value(name);
  static Insertable<Taxe> custom({
    Expression<int>? id,
    Expression<String>? name,
    Expression<double>? rate,
    Expression<String>? updatedAt,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (name != null) 'name': name,
      if (rate != null) 'rate': rate,
      if (updatedAt != null) 'updated_at': updatedAt,
    });
  }

  TaxesCompanion copyWith(
      {Value<int>? id,
      Value<String>? name,
      Value<double>? rate,
      Value<String?>? updatedAt}) {
    return TaxesCompanion(
      id: id ?? this.id,
      name: name ?? this.name,
      rate: rate ?? this.rate,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (rate.present) {
      map['rate'] = Variable<double>(rate.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<String>(updatedAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('TaxesCompanion(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('rate: $rate, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }
}

class $UnitsTable extends Units with TableInfo<$UnitsTable, Unit> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $UnitsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
      'id', aliasedName, false,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _unitCodeMeta =
      const VerificationMeta('unitCode');
  @override
  late final GeneratedColumn<String> unitCode = GeneratedColumn<String>(
      'unit_code', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _unitNameMeta =
      const VerificationMeta('unitName');
  @override
  late final GeneratedColumn<String> unitName = GeneratedColumn<String>(
      'unit_name', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _baseUnitMeta =
      const VerificationMeta('baseUnit');
  @override
  late final GeneratedColumn<int> baseUnit = GeneratedColumn<int>(
      'base_unit', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _operatorMeta =
      const VerificationMeta('operator');
  @override
  late final GeneratedColumn<String> operator = GeneratedColumn<String>(
      'operator', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _operationValueMeta =
      const VerificationMeta('operationValue');
  @override
  late final GeneratedColumn<double> operationValue = GeneratedColumn<double>(
      'operation_value', aliasedName, false,
      type: DriftSqlType.double,
      requiredDuringInsert: false,
      defaultValue: const Constant(1));
  static const VerificationMeta _updatedAtMeta =
      const VerificationMeta('updatedAt');
  @override
  late final GeneratedColumn<String> updatedAt = GeneratedColumn<String>(
      'updated_at', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  @override
  List<GeneratedColumn> get $columns =>
      [id, unitCode, unitName, baseUnit, operator, operationValue, updatedAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'units';
  @override
  VerificationContext validateIntegrity(Insertable<Unit> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('unit_code')) {
      context.handle(_unitCodeMeta,
          unitCode.isAcceptableOrUnknown(data['unit_code']!, _unitCodeMeta));
    }
    if (data.containsKey('unit_name')) {
      context.handle(_unitNameMeta,
          unitName.isAcceptableOrUnknown(data['unit_name']!, _unitNameMeta));
    } else if (isInserting) {
      context.missing(_unitNameMeta);
    }
    if (data.containsKey('base_unit')) {
      context.handle(_baseUnitMeta,
          baseUnit.isAcceptableOrUnknown(data['base_unit']!, _baseUnitMeta));
    }
    if (data.containsKey('operator')) {
      context.handle(_operatorMeta,
          operator.isAcceptableOrUnknown(data['operator']!, _operatorMeta));
    }
    if (data.containsKey('operation_value')) {
      context.handle(
          _operationValueMeta,
          operationValue.isAcceptableOrUnknown(
              data['operation_value']!, _operationValueMeta));
    }
    if (data.containsKey('updated_at')) {
      context.handle(_updatedAtMeta,
          updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  Unit map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return Unit(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}id'])!,
      unitCode: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}unit_code']),
      unitName: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}unit_name'])!,
      baseUnit: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}base_unit']),
      operator: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}operator']),
      operationValue: attachedDatabase.typeMapping.read(
          DriftSqlType.double, data['${effectivePrefix}operation_value'])!,
      updatedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}updated_at']),
    );
  }

  @override
  $UnitsTable createAlias(String alias) {
    return $UnitsTable(attachedDatabase, alias);
  }
}

class Unit extends DataClass implements Insertable<Unit> {
  final int id;
  final String? unitCode;
  final String unitName;
  final int? baseUnit;
  final String? operator;
  final double operationValue;
  final String? updatedAt;
  const Unit(
      {required this.id,
      this.unitCode,
      required this.unitName,
      this.baseUnit,
      this.operator,
      required this.operationValue,
      this.updatedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    if (!nullToAbsent || unitCode != null) {
      map['unit_code'] = Variable<String>(unitCode);
    }
    map['unit_name'] = Variable<String>(unitName);
    if (!nullToAbsent || baseUnit != null) {
      map['base_unit'] = Variable<int>(baseUnit);
    }
    if (!nullToAbsent || operator != null) {
      map['operator'] = Variable<String>(operator);
    }
    map['operation_value'] = Variable<double>(operationValue);
    if (!nullToAbsent || updatedAt != null) {
      map['updated_at'] = Variable<String>(updatedAt);
    }
    return map;
  }

  UnitsCompanion toCompanion(bool nullToAbsent) {
    return UnitsCompanion(
      id: Value(id),
      unitCode: unitCode == null && nullToAbsent
          ? const Value.absent()
          : Value(unitCode),
      unitName: Value(unitName),
      baseUnit: baseUnit == null && nullToAbsent
          ? const Value.absent()
          : Value(baseUnit),
      operator: operator == null && nullToAbsent
          ? const Value.absent()
          : Value(operator),
      operationValue: Value(operationValue),
      updatedAt: updatedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(updatedAt),
    );
  }

  factory Unit.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return Unit(
      id: serializer.fromJson<int>(json['id']),
      unitCode: serializer.fromJson<String?>(json['unitCode']),
      unitName: serializer.fromJson<String>(json['unitName']),
      baseUnit: serializer.fromJson<int?>(json['baseUnit']),
      operator: serializer.fromJson<String?>(json['operator']),
      operationValue: serializer.fromJson<double>(json['operationValue']),
      updatedAt: serializer.fromJson<String?>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'unitCode': serializer.toJson<String?>(unitCode),
      'unitName': serializer.toJson<String>(unitName),
      'baseUnit': serializer.toJson<int?>(baseUnit),
      'operator': serializer.toJson<String?>(operator),
      'operationValue': serializer.toJson<double>(operationValue),
      'updatedAt': serializer.toJson<String?>(updatedAt),
    };
  }

  Unit copyWith(
          {int? id,
          Value<String?> unitCode = const Value.absent(),
          String? unitName,
          Value<int?> baseUnit = const Value.absent(),
          Value<String?> operator = const Value.absent(),
          double? operationValue,
          Value<String?> updatedAt = const Value.absent()}) =>
      Unit(
        id: id ?? this.id,
        unitCode: unitCode.present ? unitCode.value : this.unitCode,
        unitName: unitName ?? this.unitName,
        baseUnit: baseUnit.present ? baseUnit.value : this.baseUnit,
        operator: operator.present ? operator.value : this.operator,
        operationValue: operationValue ?? this.operationValue,
        updatedAt: updatedAt.present ? updatedAt.value : this.updatedAt,
      );
  Unit copyWithCompanion(UnitsCompanion data) {
    return Unit(
      id: data.id.present ? data.id.value : this.id,
      unitCode: data.unitCode.present ? data.unitCode.value : this.unitCode,
      unitName: data.unitName.present ? data.unitName.value : this.unitName,
      baseUnit: data.baseUnit.present ? data.baseUnit.value : this.baseUnit,
      operator: data.operator.present ? data.operator.value : this.operator,
      operationValue: data.operationValue.present
          ? data.operationValue.value
          : this.operationValue,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('Unit(')
          ..write('id: $id, ')
          ..write('unitCode: $unitCode, ')
          ..write('unitName: $unitName, ')
          ..write('baseUnit: $baseUnit, ')
          ..write('operator: $operator, ')
          ..write('operationValue: $operationValue, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
      id, unitCode, unitName, baseUnit, operator, operationValue, updatedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Unit &&
          other.id == this.id &&
          other.unitCode == this.unitCode &&
          other.unitName == this.unitName &&
          other.baseUnit == this.baseUnit &&
          other.operator == this.operator &&
          other.operationValue == this.operationValue &&
          other.updatedAt == this.updatedAt);
}

class UnitsCompanion extends UpdateCompanion<Unit> {
  final Value<int> id;
  final Value<String?> unitCode;
  final Value<String> unitName;
  final Value<int?> baseUnit;
  final Value<String?> operator;
  final Value<double> operationValue;
  final Value<String?> updatedAt;
  const UnitsCompanion({
    this.id = const Value.absent(),
    this.unitCode = const Value.absent(),
    this.unitName = const Value.absent(),
    this.baseUnit = const Value.absent(),
    this.operator = const Value.absent(),
    this.operationValue = const Value.absent(),
    this.updatedAt = const Value.absent(),
  });
  UnitsCompanion.insert({
    this.id = const Value.absent(),
    this.unitCode = const Value.absent(),
    required String unitName,
    this.baseUnit = const Value.absent(),
    this.operator = const Value.absent(),
    this.operationValue = const Value.absent(),
    this.updatedAt = const Value.absent(),
  }) : unitName = Value(unitName);
  static Insertable<Unit> custom({
    Expression<int>? id,
    Expression<String>? unitCode,
    Expression<String>? unitName,
    Expression<int>? baseUnit,
    Expression<String>? operator,
    Expression<double>? operationValue,
    Expression<String>? updatedAt,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (unitCode != null) 'unit_code': unitCode,
      if (unitName != null) 'unit_name': unitName,
      if (baseUnit != null) 'base_unit': baseUnit,
      if (operator != null) 'operator': operator,
      if (operationValue != null) 'operation_value': operationValue,
      if (updatedAt != null) 'updated_at': updatedAt,
    });
  }

  UnitsCompanion copyWith(
      {Value<int>? id,
      Value<String?>? unitCode,
      Value<String>? unitName,
      Value<int?>? baseUnit,
      Value<String?>? operator,
      Value<double>? operationValue,
      Value<String?>? updatedAt}) {
    return UnitsCompanion(
      id: id ?? this.id,
      unitCode: unitCode ?? this.unitCode,
      unitName: unitName ?? this.unitName,
      baseUnit: baseUnit ?? this.baseUnit,
      operator: operator ?? this.operator,
      operationValue: operationValue ?? this.operationValue,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (unitCode.present) {
      map['unit_code'] = Variable<String>(unitCode.value);
    }
    if (unitName.present) {
      map['unit_name'] = Variable<String>(unitName.value);
    }
    if (baseUnit.present) {
      map['base_unit'] = Variable<int>(baseUnit.value);
    }
    if (operator.present) {
      map['operator'] = Variable<String>(operator.value);
    }
    if (operationValue.present) {
      map['operation_value'] = Variable<double>(operationValue.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<String>(updatedAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('UnitsCompanion(')
          ..write('id: $id, ')
          ..write('unitCode: $unitCode, ')
          ..write('unitName: $unitName, ')
          ..write('baseUnit: $baseUnit, ')
          ..write('operator: $operator, ')
          ..write('operationValue: $operationValue, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }
}

class $CustomersTable extends Customers
    with TableInfo<$CustomersTable, Customer> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $CustomersTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
      'id', aliasedName, false,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _nameMeta = const VerificationMeta('name');
  @override
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
      'name', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _phoneNumberMeta =
      const VerificationMeta('phoneNumber');
  @override
  late final GeneratedColumn<String> phoneNumber = GeneratedColumn<String>(
      'phone_number', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _emailMeta = const VerificationMeta('email');
  @override
  late final GeneratedColumn<String> email = GeneratedColumn<String>(
      'email', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _cityMeta = const VerificationMeta('city');
  @override
  late final GeneratedColumn<String> city = GeneratedColumn<String>(
      'city', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _customerGroupIdMeta =
      const VerificationMeta('customerGroupId');
  @override
  late final GeneratedColumn<int> customerGroupId = GeneratedColumn<int>(
      'customer_group_id', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _updatedAtMeta =
      const VerificationMeta('updatedAt');
  @override
  late final GeneratedColumn<String> updatedAt = GeneratedColumn<String>(
      'updated_at', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  @override
  List<GeneratedColumn> get $columns =>
      [id, name, phoneNumber, email, city, customerGroupId, updatedAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'customers';
  @override
  VerificationContext validateIntegrity(Insertable<Customer> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('name')) {
      context.handle(
          _nameMeta, name.isAcceptableOrUnknown(data['name']!, _nameMeta));
    } else if (isInserting) {
      context.missing(_nameMeta);
    }
    if (data.containsKey('phone_number')) {
      context.handle(
          _phoneNumberMeta,
          phoneNumber.isAcceptableOrUnknown(
              data['phone_number']!, _phoneNumberMeta));
    }
    if (data.containsKey('email')) {
      context.handle(
          _emailMeta, email.isAcceptableOrUnknown(data['email']!, _emailMeta));
    }
    if (data.containsKey('city')) {
      context.handle(
          _cityMeta, city.isAcceptableOrUnknown(data['city']!, _cityMeta));
    }
    if (data.containsKey('customer_group_id')) {
      context.handle(
          _customerGroupIdMeta,
          customerGroupId.isAcceptableOrUnknown(
              data['customer_group_id']!, _customerGroupIdMeta));
    }
    if (data.containsKey('updated_at')) {
      context.handle(_updatedAtMeta,
          updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  Customer map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return Customer(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}id'])!,
      name: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}name'])!,
      phoneNumber: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}phone_number']),
      email: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}email']),
      city: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}city']),
      customerGroupId: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}customer_group_id']),
      updatedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}updated_at']),
    );
  }

  @override
  $CustomersTable createAlias(String alias) {
    return $CustomersTable(attachedDatabase, alias);
  }
}

class Customer extends DataClass implements Insertable<Customer> {
  final int id;
  final String name;
  final String? phoneNumber;
  final String? email;
  final String? city;
  final int? customerGroupId;
  final String? updatedAt;
  const Customer(
      {required this.id,
      required this.name,
      this.phoneNumber,
      this.email,
      this.city,
      this.customerGroupId,
      this.updatedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['name'] = Variable<String>(name);
    if (!nullToAbsent || phoneNumber != null) {
      map['phone_number'] = Variable<String>(phoneNumber);
    }
    if (!nullToAbsent || email != null) {
      map['email'] = Variable<String>(email);
    }
    if (!nullToAbsent || city != null) {
      map['city'] = Variable<String>(city);
    }
    if (!nullToAbsent || customerGroupId != null) {
      map['customer_group_id'] = Variable<int>(customerGroupId);
    }
    if (!nullToAbsent || updatedAt != null) {
      map['updated_at'] = Variable<String>(updatedAt);
    }
    return map;
  }

  CustomersCompanion toCompanion(bool nullToAbsent) {
    return CustomersCompanion(
      id: Value(id),
      name: Value(name),
      phoneNumber: phoneNumber == null && nullToAbsent
          ? const Value.absent()
          : Value(phoneNumber),
      email:
          email == null && nullToAbsent ? const Value.absent() : Value(email),
      city: city == null && nullToAbsent ? const Value.absent() : Value(city),
      customerGroupId: customerGroupId == null && nullToAbsent
          ? const Value.absent()
          : Value(customerGroupId),
      updatedAt: updatedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(updatedAt),
    );
  }

  factory Customer.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return Customer(
      id: serializer.fromJson<int>(json['id']),
      name: serializer.fromJson<String>(json['name']),
      phoneNumber: serializer.fromJson<String?>(json['phoneNumber']),
      email: serializer.fromJson<String?>(json['email']),
      city: serializer.fromJson<String?>(json['city']),
      customerGroupId: serializer.fromJson<int?>(json['customerGroupId']),
      updatedAt: serializer.fromJson<String?>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'name': serializer.toJson<String>(name),
      'phoneNumber': serializer.toJson<String?>(phoneNumber),
      'email': serializer.toJson<String?>(email),
      'city': serializer.toJson<String?>(city),
      'customerGroupId': serializer.toJson<int?>(customerGroupId),
      'updatedAt': serializer.toJson<String?>(updatedAt),
    };
  }

  Customer copyWith(
          {int? id,
          String? name,
          Value<String?> phoneNumber = const Value.absent(),
          Value<String?> email = const Value.absent(),
          Value<String?> city = const Value.absent(),
          Value<int?> customerGroupId = const Value.absent(),
          Value<String?> updatedAt = const Value.absent()}) =>
      Customer(
        id: id ?? this.id,
        name: name ?? this.name,
        phoneNumber: phoneNumber.present ? phoneNumber.value : this.phoneNumber,
        email: email.present ? email.value : this.email,
        city: city.present ? city.value : this.city,
        customerGroupId: customerGroupId.present
            ? customerGroupId.value
            : this.customerGroupId,
        updatedAt: updatedAt.present ? updatedAt.value : this.updatedAt,
      );
  Customer copyWithCompanion(CustomersCompanion data) {
    return Customer(
      id: data.id.present ? data.id.value : this.id,
      name: data.name.present ? data.name.value : this.name,
      phoneNumber:
          data.phoneNumber.present ? data.phoneNumber.value : this.phoneNumber,
      email: data.email.present ? data.email.value : this.email,
      city: data.city.present ? data.city.value : this.city,
      customerGroupId: data.customerGroupId.present
          ? data.customerGroupId.value
          : this.customerGroupId,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('Customer(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('phoneNumber: $phoneNumber, ')
          ..write('email: $email, ')
          ..write('city: $city, ')
          ..write('customerGroupId: $customerGroupId, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
      id, name, phoneNumber, email, city, customerGroupId, updatedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Customer &&
          other.id == this.id &&
          other.name == this.name &&
          other.phoneNumber == this.phoneNumber &&
          other.email == this.email &&
          other.city == this.city &&
          other.customerGroupId == this.customerGroupId &&
          other.updatedAt == this.updatedAt);
}

class CustomersCompanion extends UpdateCompanion<Customer> {
  final Value<int> id;
  final Value<String> name;
  final Value<String?> phoneNumber;
  final Value<String?> email;
  final Value<String?> city;
  final Value<int?> customerGroupId;
  final Value<String?> updatedAt;
  const CustomersCompanion({
    this.id = const Value.absent(),
    this.name = const Value.absent(),
    this.phoneNumber = const Value.absent(),
    this.email = const Value.absent(),
    this.city = const Value.absent(),
    this.customerGroupId = const Value.absent(),
    this.updatedAt = const Value.absent(),
  });
  CustomersCompanion.insert({
    this.id = const Value.absent(),
    required String name,
    this.phoneNumber = const Value.absent(),
    this.email = const Value.absent(),
    this.city = const Value.absent(),
    this.customerGroupId = const Value.absent(),
    this.updatedAt = const Value.absent(),
  }) : name = Value(name);
  static Insertable<Customer> custom({
    Expression<int>? id,
    Expression<String>? name,
    Expression<String>? phoneNumber,
    Expression<String>? email,
    Expression<String>? city,
    Expression<int>? customerGroupId,
    Expression<String>? updatedAt,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (name != null) 'name': name,
      if (phoneNumber != null) 'phone_number': phoneNumber,
      if (email != null) 'email': email,
      if (city != null) 'city': city,
      if (customerGroupId != null) 'customer_group_id': customerGroupId,
      if (updatedAt != null) 'updated_at': updatedAt,
    });
  }

  CustomersCompanion copyWith(
      {Value<int>? id,
      Value<String>? name,
      Value<String?>? phoneNumber,
      Value<String?>? email,
      Value<String?>? city,
      Value<int?>? customerGroupId,
      Value<String?>? updatedAt}) {
    return CustomersCompanion(
      id: id ?? this.id,
      name: name ?? this.name,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      email: email ?? this.email,
      city: city ?? this.city,
      customerGroupId: customerGroupId ?? this.customerGroupId,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (phoneNumber.present) {
      map['phone_number'] = Variable<String>(phoneNumber.value);
    }
    if (email.present) {
      map['email'] = Variable<String>(email.value);
    }
    if (city.present) {
      map['city'] = Variable<String>(city.value);
    }
    if (customerGroupId.present) {
      map['customer_group_id'] = Variable<int>(customerGroupId.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<String>(updatedAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('CustomersCompanion(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('phoneNumber: $phoneNumber, ')
          ..write('email: $email, ')
          ..write('city: $city, ')
          ..write('customerGroupId: $customerGroupId, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }
}

class $LocalCouponsTable extends LocalCoupons
    with TableInfo<$LocalCouponsTable, LocalCoupon> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalCouponsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
      'id', aliasedName, false,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _codeMeta = const VerificationMeta('code');
  @override
  late final GeneratedColumn<String> code = GeneratedColumn<String>(
      'code', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _typeMeta = const VerificationMeta('type');
  @override
  late final GeneratedColumn<String> type = GeneratedColumn<String>(
      'type', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant('percentage'));
  static const VerificationMeta _amountMeta = const VerificationMeta('amount');
  @override
  late final GeneratedColumn<double> amount = GeneratedColumn<double>(
      'amount', aliasedName, false,
      type: DriftSqlType.double,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _minimumAmountMeta =
      const VerificationMeta('minimumAmount');
  @override
  late final GeneratedColumn<double> minimumAmount = GeneratedColumn<double>(
      'minimum_amount', aliasedName, false,
      type: DriftSqlType.double,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _quantityMeta =
      const VerificationMeta('quantity');
  @override
  late final GeneratedColumn<double> quantity = GeneratedColumn<double>(
      'quantity', aliasedName, true,
      type: DriftSqlType.double, requiredDuringInsert: false);
  static const VerificationMeta _usedMeta = const VerificationMeta('used');
  @override
  late final GeneratedColumn<double> used = GeneratedColumn<double>(
      'used', aliasedName, false,
      type: DriftSqlType.double,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _expiredDateMeta =
      const VerificationMeta('expiredDate');
  @override
  late final GeneratedColumn<String> expiredDate = GeneratedColumn<String>(
      'expired_date', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _updatedAtMeta =
      const VerificationMeta('updatedAt');
  @override
  late final GeneratedColumn<String> updatedAt = GeneratedColumn<String>(
      'updated_at', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        code,
        type,
        amount,
        minimumAmount,
        quantity,
        used,
        expiredDate,
        updatedAt
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_coupons';
  @override
  VerificationContext validateIntegrity(Insertable<LocalCoupon> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('code')) {
      context.handle(
          _codeMeta, code.isAcceptableOrUnknown(data['code']!, _codeMeta));
    } else if (isInserting) {
      context.missing(_codeMeta);
    }
    if (data.containsKey('type')) {
      context.handle(
          _typeMeta, type.isAcceptableOrUnknown(data['type']!, _typeMeta));
    }
    if (data.containsKey('amount')) {
      context.handle(_amountMeta,
          amount.isAcceptableOrUnknown(data['amount']!, _amountMeta));
    }
    if (data.containsKey('minimum_amount')) {
      context.handle(
          _minimumAmountMeta,
          minimumAmount.isAcceptableOrUnknown(
              data['minimum_amount']!, _minimumAmountMeta));
    }
    if (data.containsKey('quantity')) {
      context.handle(_quantityMeta,
          quantity.isAcceptableOrUnknown(data['quantity']!, _quantityMeta));
    }
    if (data.containsKey('used')) {
      context.handle(
          _usedMeta, used.isAcceptableOrUnknown(data['used']!, _usedMeta));
    }
    if (data.containsKey('expired_date')) {
      context.handle(
          _expiredDateMeta,
          expiredDate.isAcceptableOrUnknown(
              data['expired_date']!, _expiredDateMeta));
    }
    if (data.containsKey('updated_at')) {
      context.handle(_updatedAtMeta,
          updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalCoupon map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalCoupon(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}id'])!,
      code: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}code'])!,
      type: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}type'])!,
      amount: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}amount'])!,
      minimumAmount: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}minimum_amount'])!,
      quantity: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}quantity']),
      used: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}used'])!,
      expiredDate: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}expired_date']),
      updatedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}updated_at']),
    );
  }

  @override
  $LocalCouponsTable createAlias(String alias) {
    return $LocalCouponsTable(attachedDatabase, alias);
  }
}

class LocalCoupon extends DataClass implements Insertable<LocalCoupon> {
  final int id;
  final String code;
  final String type;
  final double amount;
  final double minimumAmount;
  final double? quantity;
  final double used;
  final String? expiredDate;
  final String? updatedAt;
  const LocalCoupon(
      {required this.id,
      required this.code,
      required this.type,
      required this.amount,
      required this.minimumAmount,
      this.quantity,
      required this.used,
      this.expiredDate,
      this.updatedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['code'] = Variable<String>(code);
    map['type'] = Variable<String>(type);
    map['amount'] = Variable<double>(amount);
    map['minimum_amount'] = Variable<double>(minimumAmount);
    if (!nullToAbsent || quantity != null) {
      map['quantity'] = Variable<double>(quantity);
    }
    map['used'] = Variable<double>(used);
    if (!nullToAbsent || expiredDate != null) {
      map['expired_date'] = Variable<String>(expiredDate);
    }
    if (!nullToAbsent || updatedAt != null) {
      map['updated_at'] = Variable<String>(updatedAt);
    }
    return map;
  }

  LocalCouponsCompanion toCompanion(bool nullToAbsent) {
    return LocalCouponsCompanion(
      id: Value(id),
      code: Value(code),
      type: Value(type),
      amount: Value(amount),
      minimumAmount: Value(minimumAmount),
      quantity: quantity == null && nullToAbsent
          ? const Value.absent()
          : Value(quantity),
      used: Value(used),
      expiredDate: expiredDate == null && nullToAbsent
          ? const Value.absent()
          : Value(expiredDate),
      updatedAt: updatedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(updatedAt),
    );
  }

  factory LocalCoupon.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalCoupon(
      id: serializer.fromJson<int>(json['id']),
      code: serializer.fromJson<String>(json['code']),
      type: serializer.fromJson<String>(json['type']),
      amount: serializer.fromJson<double>(json['amount']),
      minimumAmount: serializer.fromJson<double>(json['minimumAmount']),
      quantity: serializer.fromJson<double?>(json['quantity']),
      used: serializer.fromJson<double>(json['used']),
      expiredDate: serializer.fromJson<String?>(json['expiredDate']),
      updatedAt: serializer.fromJson<String?>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'code': serializer.toJson<String>(code),
      'type': serializer.toJson<String>(type),
      'amount': serializer.toJson<double>(amount),
      'minimumAmount': serializer.toJson<double>(minimumAmount),
      'quantity': serializer.toJson<double?>(quantity),
      'used': serializer.toJson<double>(used),
      'expiredDate': serializer.toJson<String?>(expiredDate),
      'updatedAt': serializer.toJson<String?>(updatedAt),
    };
  }

  LocalCoupon copyWith(
          {int? id,
          String? code,
          String? type,
          double? amount,
          double? minimumAmount,
          Value<double?> quantity = const Value.absent(),
          double? used,
          Value<String?> expiredDate = const Value.absent(),
          Value<String?> updatedAt = const Value.absent()}) =>
      LocalCoupon(
        id: id ?? this.id,
        code: code ?? this.code,
        type: type ?? this.type,
        amount: amount ?? this.amount,
        minimumAmount: minimumAmount ?? this.minimumAmount,
        quantity: quantity.present ? quantity.value : this.quantity,
        used: used ?? this.used,
        expiredDate: expiredDate.present ? expiredDate.value : this.expiredDate,
        updatedAt: updatedAt.present ? updatedAt.value : this.updatedAt,
      );
  LocalCoupon copyWithCompanion(LocalCouponsCompanion data) {
    return LocalCoupon(
      id: data.id.present ? data.id.value : this.id,
      code: data.code.present ? data.code.value : this.code,
      type: data.type.present ? data.type.value : this.type,
      amount: data.amount.present ? data.amount.value : this.amount,
      minimumAmount: data.minimumAmount.present
          ? data.minimumAmount.value
          : this.minimumAmount,
      quantity: data.quantity.present ? data.quantity.value : this.quantity,
      used: data.used.present ? data.used.value : this.used,
      expiredDate:
          data.expiredDate.present ? data.expiredDate.value : this.expiredDate,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalCoupon(')
          ..write('id: $id, ')
          ..write('code: $code, ')
          ..write('type: $type, ')
          ..write('amount: $amount, ')
          ..write('minimumAmount: $minimumAmount, ')
          ..write('quantity: $quantity, ')
          ..write('used: $used, ')
          ..write('expiredDate: $expiredDate, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, code, type, amount, minimumAmount,
      quantity, used, expiredDate, updatedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalCoupon &&
          other.id == this.id &&
          other.code == this.code &&
          other.type == this.type &&
          other.amount == this.amount &&
          other.minimumAmount == this.minimumAmount &&
          other.quantity == this.quantity &&
          other.used == this.used &&
          other.expiredDate == this.expiredDate &&
          other.updatedAt == this.updatedAt);
}

class LocalCouponsCompanion extends UpdateCompanion<LocalCoupon> {
  final Value<int> id;
  final Value<String> code;
  final Value<String> type;
  final Value<double> amount;
  final Value<double> minimumAmount;
  final Value<double?> quantity;
  final Value<double> used;
  final Value<String?> expiredDate;
  final Value<String?> updatedAt;
  const LocalCouponsCompanion({
    this.id = const Value.absent(),
    this.code = const Value.absent(),
    this.type = const Value.absent(),
    this.amount = const Value.absent(),
    this.minimumAmount = const Value.absent(),
    this.quantity = const Value.absent(),
    this.used = const Value.absent(),
    this.expiredDate = const Value.absent(),
    this.updatedAt = const Value.absent(),
  });
  LocalCouponsCompanion.insert({
    this.id = const Value.absent(),
    required String code,
    this.type = const Value.absent(),
    this.amount = const Value.absent(),
    this.minimumAmount = const Value.absent(),
    this.quantity = const Value.absent(),
    this.used = const Value.absent(),
    this.expiredDate = const Value.absent(),
    this.updatedAt = const Value.absent(),
  }) : code = Value(code);
  static Insertable<LocalCoupon> custom({
    Expression<int>? id,
    Expression<String>? code,
    Expression<String>? type,
    Expression<double>? amount,
    Expression<double>? minimumAmount,
    Expression<double>? quantity,
    Expression<double>? used,
    Expression<String>? expiredDate,
    Expression<String>? updatedAt,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (code != null) 'code': code,
      if (type != null) 'type': type,
      if (amount != null) 'amount': amount,
      if (minimumAmount != null) 'minimum_amount': minimumAmount,
      if (quantity != null) 'quantity': quantity,
      if (used != null) 'used': used,
      if (expiredDate != null) 'expired_date': expiredDate,
      if (updatedAt != null) 'updated_at': updatedAt,
    });
  }

  LocalCouponsCompanion copyWith(
      {Value<int>? id,
      Value<String>? code,
      Value<String>? type,
      Value<double>? amount,
      Value<double>? minimumAmount,
      Value<double?>? quantity,
      Value<double>? used,
      Value<String?>? expiredDate,
      Value<String?>? updatedAt}) {
    return LocalCouponsCompanion(
      id: id ?? this.id,
      code: code ?? this.code,
      type: type ?? this.type,
      amount: amount ?? this.amount,
      minimumAmount: minimumAmount ?? this.minimumAmount,
      quantity: quantity ?? this.quantity,
      used: used ?? this.used,
      expiredDate: expiredDate ?? this.expiredDate,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (code.present) {
      map['code'] = Variable<String>(code.value);
    }
    if (type.present) {
      map['type'] = Variable<String>(type.value);
    }
    if (amount.present) {
      map['amount'] = Variable<double>(amount.value);
    }
    if (minimumAmount.present) {
      map['minimum_amount'] = Variable<double>(minimumAmount.value);
    }
    if (quantity.present) {
      map['quantity'] = Variable<double>(quantity.value);
    }
    if (used.present) {
      map['used'] = Variable<double>(used.value);
    }
    if (expiredDate.present) {
      map['expired_date'] = Variable<String>(expiredDate.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<String>(updatedAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalCouponsCompanion(')
          ..write('id: $id, ')
          ..write('code: $code, ')
          ..write('type: $type, ')
          ..write('amount: $amount, ')
          ..write('minimumAmount: $minimumAmount, ')
          ..write('quantity: $quantity, ')
          ..write('used: $used, ')
          ..write('expiredDate: $expiredDate, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }
}

class $BillersTable extends Billers with TableInfo<$BillersTable, Biller> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $BillersTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
      'id', aliasedName, false,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _nameMeta = const VerificationMeta('name');
  @override
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
      'name', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _companyNameMeta =
      const VerificationMeta('companyName');
  @override
  late final GeneratedColumn<String> companyName = GeneratedColumn<String>(
      'company_name', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _updatedAtMeta =
      const VerificationMeta('updatedAt');
  @override
  late final GeneratedColumn<String> updatedAt = GeneratedColumn<String>(
      'updated_at', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  @override
  List<GeneratedColumn> get $columns => [id, name, companyName, updatedAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'billers';
  @override
  VerificationContext validateIntegrity(Insertable<Biller> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('name')) {
      context.handle(
          _nameMeta, name.isAcceptableOrUnknown(data['name']!, _nameMeta));
    } else if (isInserting) {
      context.missing(_nameMeta);
    }
    if (data.containsKey('company_name')) {
      context.handle(
          _companyNameMeta,
          companyName.isAcceptableOrUnknown(
              data['company_name']!, _companyNameMeta));
    }
    if (data.containsKey('updated_at')) {
      context.handle(_updatedAtMeta,
          updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  Biller map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return Biller(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}id'])!,
      name: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}name'])!,
      companyName: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}company_name']),
      updatedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}updated_at']),
    );
  }

  @override
  $BillersTable createAlias(String alias) {
    return $BillersTable(attachedDatabase, alias);
  }
}

class Biller extends DataClass implements Insertable<Biller> {
  final int id;
  final String name;
  final String? companyName;
  final String? updatedAt;
  const Biller(
      {required this.id, required this.name, this.companyName, this.updatedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['name'] = Variable<String>(name);
    if (!nullToAbsent || companyName != null) {
      map['company_name'] = Variable<String>(companyName);
    }
    if (!nullToAbsent || updatedAt != null) {
      map['updated_at'] = Variable<String>(updatedAt);
    }
    return map;
  }

  BillersCompanion toCompanion(bool nullToAbsent) {
    return BillersCompanion(
      id: Value(id),
      name: Value(name),
      companyName: companyName == null && nullToAbsent
          ? const Value.absent()
          : Value(companyName),
      updatedAt: updatedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(updatedAt),
    );
  }

  factory Biller.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return Biller(
      id: serializer.fromJson<int>(json['id']),
      name: serializer.fromJson<String>(json['name']),
      companyName: serializer.fromJson<String?>(json['companyName']),
      updatedAt: serializer.fromJson<String?>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'name': serializer.toJson<String>(name),
      'companyName': serializer.toJson<String?>(companyName),
      'updatedAt': serializer.toJson<String?>(updatedAt),
    };
  }

  Biller copyWith(
          {int? id,
          String? name,
          Value<String?> companyName = const Value.absent(),
          Value<String?> updatedAt = const Value.absent()}) =>
      Biller(
        id: id ?? this.id,
        name: name ?? this.name,
        companyName: companyName.present ? companyName.value : this.companyName,
        updatedAt: updatedAt.present ? updatedAt.value : this.updatedAt,
      );
  Biller copyWithCompanion(BillersCompanion data) {
    return Biller(
      id: data.id.present ? data.id.value : this.id,
      name: data.name.present ? data.name.value : this.name,
      companyName:
          data.companyName.present ? data.companyName.value : this.companyName,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('Biller(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('companyName: $companyName, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, name, companyName, updatedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Biller &&
          other.id == this.id &&
          other.name == this.name &&
          other.companyName == this.companyName &&
          other.updatedAt == this.updatedAt);
}

class BillersCompanion extends UpdateCompanion<Biller> {
  final Value<int> id;
  final Value<String> name;
  final Value<String?> companyName;
  final Value<String?> updatedAt;
  const BillersCompanion({
    this.id = const Value.absent(),
    this.name = const Value.absent(),
    this.companyName = const Value.absent(),
    this.updatedAt = const Value.absent(),
  });
  BillersCompanion.insert({
    this.id = const Value.absent(),
    required String name,
    this.companyName = const Value.absent(),
    this.updatedAt = const Value.absent(),
  }) : name = Value(name);
  static Insertable<Biller> custom({
    Expression<int>? id,
    Expression<String>? name,
    Expression<String>? companyName,
    Expression<String>? updatedAt,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (name != null) 'name': name,
      if (companyName != null) 'company_name': companyName,
      if (updatedAt != null) 'updated_at': updatedAt,
    });
  }

  BillersCompanion copyWith(
      {Value<int>? id,
      Value<String>? name,
      Value<String?>? companyName,
      Value<String?>? updatedAt}) {
    return BillersCompanion(
      id: id ?? this.id,
      name: name ?? this.name,
      companyName: companyName ?? this.companyName,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (companyName.present) {
      map['company_name'] = Variable<String>(companyName.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<String>(updatedAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('BillersCompanion(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('companyName: $companyName, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }
}

class $ProductsTable extends Products with TableInfo<$ProductsTable, Product> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $ProductsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
      'id', aliasedName, false,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _nameMeta = const VerificationMeta('name');
  @override
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
      'name', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _codeMeta = const VerificationMeta('code');
  @override
  late final GeneratedColumn<String> code = GeneratedColumn<String>(
      'code', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _typeMeta = const VerificationMeta('type');
  @override
  late final GeneratedColumn<String> type = GeneratedColumn<String>(
      'type', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant('standard'));
  static const VerificationMeta _brandIdMeta =
      const VerificationMeta('brandId');
  @override
  late final GeneratedColumn<int> brandId = GeneratedColumn<int>(
      'brand_id', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _categoryIdMeta =
      const VerificationMeta('categoryId');
  @override
  late final GeneratedColumn<int> categoryId = GeneratedColumn<int>(
      'category_id', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _unitIdMeta = const VerificationMeta('unitId');
  @override
  late final GeneratedColumn<int> unitId = GeneratedColumn<int>(
      'unit_id', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _saleUnitIdMeta =
      const VerificationMeta('saleUnitId');
  @override
  late final GeneratedColumn<int> saleUnitId = GeneratedColumn<int>(
      'sale_unit_id', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _costMeta = const VerificationMeta('cost');
  @override
  late final GeneratedColumn<double> cost = GeneratedColumn<double>(
      'cost', aliasedName, false,
      type: DriftSqlType.double,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _priceMeta = const VerificationMeta('price');
  @override
  late final GeneratedColumn<double> price = GeneratedColumn<double>(
      'price', aliasedName, false,
      type: DriftSqlType.double,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _wholesalePriceMeta =
      const VerificationMeta('wholesalePrice');
  @override
  late final GeneratedColumn<double> wholesalePrice = GeneratedColumn<double>(
      'wholesale_price', aliasedName, false,
      type: DriftSqlType.double,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _taxIdMeta = const VerificationMeta('taxId');
  @override
  late final GeneratedColumn<int> taxId = GeneratedColumn<int>(
      'tax_id', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _taxMethodMeta =
      const VerificationMeta('taxMethod');
  @override
  late final GeneratedColumn<int> taxMethod = GeneratedColumn<int>(
      'tax_method', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(1));
  static const VerificationMeta _imageMeta = const VerificationMeta('image');
  @override
  late final GeneratedColumn<String> image = GeneratedColumn<String>(
      'image', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _isVariantMeta =
      const VerificationMeta('isVariant');
  @override
  late final GeneratedColumn<bool> isVariant = GeneratedColumn<bool>(
      'is_variant', aliasedName, false,
      type: DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('CHECK ("is_variant" IN (0, 1))'),
      defaultValue: const Constant(false));
  static const VerificationMeta _isBatchMeta =
      const VerificationMeta('isBatch');
  @override
  late final GeneratedColumn<bool> isBatch = GeneratedColumn<bool>(
      'is_batch', aliasedName, false,
      type: DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('CHECK ("is_batch" IN (0, 1))'),
      defaultValue: const Constant(false));
  static const VerificationMeta _isImeiMeta = const VerificationMeta('isImei');
  @override
  late final GeneratedColumn<bool> isImei = GeneratedColumn<bool>(
      'is_imei', aliasedName, false,
      type: DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('CHECK ("is_imei" IN (0, 1))'),
      defaultValue: const Constant(false));
  static const VerificationMeta _isEmbededMeta =
      const VerificationMeta('isEmbeded');
  @override
  late final GeneratedColumn<bool> isEmbeded = GeneratedColumn<bool>(
      'is_embeded', aliasedName, false,
      type: DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('CHECK ("is_embeded" IN (0, 1))'),
      defaultValue: const Constant(false));
  static const VerificationMeta _featuredMeta =
      const VerificationMeta('featured');
  @override
  late final GeneratedColumn<int> featured = GeneratedColumn<int>(
      'featured', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _updatedAtMeta =
      const VerificationMeta('updatedAt');
  @override
  late final GeneratedColumn<String> updatedAt = GeneratedColumn<String>(
      'updated_at', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        name,
        code,
        type,
        brandId,
        categoryId,
        unitId,
        saleUnitId,
        cost,
        price,
        wholesalePrice,
        taxId,
        taxMethod,
        image,
        isVariant,
        isBatch,
        isImei,
        isEmbeded,
        featured,
        updatedAt
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'products';
  @override
  VerificationContext validateIntegrity(Insertable<Product> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('name')) {
      context.handle(
          _nameMeta, name.isAcceptableOrUnknown(data['name']!, _nameMeta));
    } else if (isInserting) {
      context.missing(_nameMeta);
    }
    if (data.containsKey('code')) {
      context.handle(
          _codeMeta, code.isAcceptableOrUnknown(data['code']!, _codeMeta));
    } else if (isInserting) {
      context.missing(_codeMeta);
    }
    if (data.containsKey('type')) {
      context.handle(
          _typeMeta, type.isAcceptableOrUnknown(data['type']!, _typeMeta));
    }
    if (data.containsKey('brand_id')) {
      context.handle(_brandIdMeta,
          brandId.isAcceptableOrUnknown(data['brand_id']!, _brandIdMeta));
    }
    if (data.containsKey('category_id')) {
      context.handle(
          _categoryIdMeta,
          categoryId.isAcceptableOrUnknown(
              data['category_id']!, _categoryIdMeta));
    }
    if (data.containsKey('unit_id')) {
      context.handle(_unitIdMeta,
          unitId.isAcceptableOrUnknown(data['unit_id']!, _unitIdMeta));
    }
    if (data.containsKey('sale_unit_id')) {
      context.handle(
          _saleUnitIdMeta,
          saleUnitId.isAcceptableOrUnknown(
              data['sale_unit_id']!, _saleUnitIdMeta));
    }
    if (data.containsKey('cost')) {
      context.handle(
          _costMeta, cost.isAcceptableOrUnknown(data['cost']!, _costMeta));
    }
    if (data.containsKey('price')) {
      context.handle(
          _priceMeta, price.isAcceptableOrUnknown(data['price']!, _priceMeta));
    }
    if (data.containsKey('wholesale_price')) {
      context.handle(
          _wholesalePriceMeta,
          wholesalePrice.isAcceptableOrUnknown(
              data['wholesale_price']!, _wholesalePriceMeta));
    }
    if (data.containsKey('tax_id')) {
      context.handle(
          _taxIdMeta, taxId.isAcceptableOrUnknown(data['tax_id']!, _taxIdMeta));
    }
    if (data.containsKey('tax_method')) {
      context.handle(_taxMethodMeta,
          taxMethod.isAcceptableOrUnknown(data['tax_method']!, _taxMethodMeta));
    }
    if (data.containsKey('image')) {
      context.handle(
          _imageMeta, image.isAcceptableOrUnknown(data['image']!, _imageMeta));
    }
    if (data.containsKey('is_variant')) {
      context.handle(_isVariantMeta,
          isVariant.isAcceptableOrUnknown(data['is_variant']!, _isVariantMeta));
    }
    if (data.containsKey('is_batch')) {
      context.handle(_isBatchMeta,
          isBatch.isAcceptableOrUnknown(data['is_batch']!, _isBatchMeta));
    }
    if (data.containsKey('is_imei')) {
      context.handle(_isImeiMeta,
          isImei.isAcceptableOrUnknown(data['is_imei']!, _isImeiMeta));
    }
    if (data.containsKey('is_embeded')) {
      context.handle(_isEmbededMeta,
          isEmbeded.isAcceptableOrUnknown(data['is_embeded']!, _isEmbededMeta));
    }
    if (data.containsKey('featured')) {
      context.handle(_featuredMeta,
          featured.isAcceptableOrUnknown(data['featured']!, _featuredMeta));
    }
    if (data.containsKey('updated_at')) {
      context.handle(_updatedAtMeta,
          updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  Product map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return Product(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}id'])!,
      name: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}name'])!,
      code: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}code'])!,
      type: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}type'])!,
      brandId: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}brand_id']),
      categoryId: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}category_id']),
      unitId: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}unit_id']),
      saleUnitId: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}sale_unit_id']),
      cost: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}cost'])!,
      price: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}price'])!,
      wholesalePrice: attachedDatabase.typeMapping.read(
          DriftSqlType.double, data['${effectivePrefix}wholesale_price'])!,
      taxId: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}tax_id']),
      taxMethod: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}tax_method'])!,
      image: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}image']),
      isVariant: attachedDatabase.typeMapping
          .read(DriftSqlType.bool, data['${effectivePrefix}is_variant'])!,
      isBatch: attachedDatabase.typeMapping
          .read(DriftSqlType.bool, data['${effectivePrefix}is_batch'])!,
      isImei: attachedDatabase.typeMapping
          .read(DriftSqlType.bool, data['${effectivePrefix}is_imei'])!,
      isEmbeded: attachedDatabase.typeMapping
          .read(DriftSqlType.bool, data['${effectivePrefix}is_embeded'])!,
      featured: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}featured'])!,
      updatedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}updated_at']),
    );
  }

  @override
  $ProductsTable createAlias(String alias) {
    return $ProductsTable(attachedDatabase, alias);
  }
}

class Product extends DataClass implements Insertable<Product> {
  final int id;
  final String name;
  final String code;
  final String type;
  final int? brandId;
  final int? categoryId;
  final int? unitId;
  final int? saleUnitId;
  final double cost;
  final double price;
  final double wholesalePrice;
  final int? taxId;
  final int taxMethod;
  final String? image;
  final bool isVariant;
  final bool isBatch;
  final bool isImei;
  final bool isEmbeded;
  final int featured;
  final String? updatedAt;
  const Product(
      {required this.id,
      required this.name,
      required this.code,
      required this.type,
      this.brandId,
      this.categoryId,
      this.unitId,
      this.saleUnitId,
      required this.cost,
      required this.price,
      required this.wholesalePrice,
      this.taxId,
      required this.taxMethod,
      this.image,
      required this.isVariant,
      required this.isBatch,
      required this.isImei,
      required this.isEmbeded,
      required this.featured,
      this.updatedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['name'] = Variable<String>(name);
    map['code'] = Variable<String>(code);
    map['type'] = Variable<String>(type);
    if (!nullToAbsent || brandId != null) {
      map['brand_id'] = Variable<int>(brandId);
    }
    if (!nullToAbsent || categoryId != null) {
      map['category_id'] = Variable<int>(categoryId);
    }
    if (!nullToAbsent || unitId != null) {
      map['unit_id'] = Variable<int>(unitId);
    }
    if (!nullToAbsent || saleUnitId != null) {
      map['sale_unit_id'] = Variable<int>(saleUnitId);
    }
    map['cost'] = Variable<double>(cost);
    map['price'] = Variable<double>(price);
    map['wholesale_price'] = Variable<double>(wholesalePrice);
    if (!nullToAbsent || taxId != null) {
      map['tax_id'] = Variable<int>(taxId);
    }
    map['tax_method'] = Variable<int>(taxMethod);
    if (!nullToAbsent || image != null) {
      map['image'] = Variable<String>(image);
    }
    map['is_variant'] = Variable<bool>(isVariant);
    map['is_batch'] = Variable<bool>(isBatch);
    map['is_imei'] = Variable<bool>(isImei);
    map['is_embeded'] = Variable<bool>(isEmbeded);
    map['featured'] = Variable<int>(featured);
    if (!nullToAbsent || updatedAt != null) {
      map['updated_at'] = Variable<String>(updatedAt);
    }
    return map;
  }

  ProductsCompanion toCompanion(bool nullToAbsent) {
    return ProductsCompanion(
      id: Value(id),
      name: Value(name),
      code: Value(code),
      type: Value(type),
      brandId: brandId == null && nullToAbsent
          ? const Value.absent()
          : Value(brandId),
      categoryId: categoryId == null && nullToAbsent
          ? const Value.absent()
          : Value(categoryId),
      unitId:
          unitId == null && nullToAbsent ? const Value.absent() : Value(unitId),
      saleUnitId: saleUnitId == null && nullToAbsent
          ? const Value.absent()
          : Value(saleUnitId),
      cost: Value(cost),
      price: Value(price),
      wholesalePrice: Value(wholesalePrice),
      taxId:
          taxId == null && nullToAbsent ? const Value.absent() : Value(taxId),
      taxMethod: Value(taxMethod),
      image:
          image == null && nullToAbsent ? const Value.absent() : Value(image),
      isVariant: Value(isVariant),
      isBatch: Value(isBatch),
      isImei: Value(isImei),
      isEmbeded: Value(isEmbeded),
      featured: Value(featured),
      updatedAt: updatedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(updatedAt),
    );
  }

  factory Product.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return Product(
      id: serializer.fromJson<int>(json['id']),
      name: serializer.fromJson<String>(json['name']),
      code: serializer.fromJson<String>(json['code']),
      type: serializer.fromJson<String>(json['type']),
      brandId: serializer.fromJson<int?>(json['brandId']),
      categoryId: serializer.fromJson<int?>(json['categoryId']),
      unitId: serializer.fromJson<int?>(json['unitId']),
      saleUnitId: serializer.fromJson<int?>(json['saleUnitId']),
      cost: serializer.fromJson<double>(json['cost']),
      price: serializer.fromJson<double>(json['price']),
      wholesalePrice: serializer.fromJson<double>(json['wholesalePrice']),
      taxId: serializer.fromJson<int?>(json['taxId']),
      taxMethod: serializer.fromJson<int>(json['taxMethod']),
      image: serializer.fromJson<String?>(json['image']),
      isVariant: serializer.fromJson<bool>(json['isVariant']),
      isBatch: serializer.fromJson<bool>(json['isBatch']),
      isImei: serializer.fromJson<bool>(json['isImei']),
      isEmbeded: serializer.fromJson<bool>(json['isEmbeded']),
      featured: serializer.fromJson<int>(json['featured']),
      updatedAt: serializer.fromJson<String?>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'name': serializer.toJson<String>(name),
      'code': serializer.toJson<String>(code),
      'type': serializer.toJson<String>(type),
      'brandId': serializer.toJson<int?>(brandId),
      'categoryId': serializer.toJson<int?>(categoryId),
      'unitId': serializer.toJson<int?>(unitId),
      'saleUnitId': serializer.toJson<int?>(saleUnitId),
      'cost': serializer.toJson<double>(cost),
      'price': serializer.toJson<double>(price),
      'wholesalePrice': serializer.toJson<double>(wholesalePrice),
      'taxId': serializer.toJson<int?>(taxId),
      'taxMethod': serializer.toJson<int>(taxMethod),
      'image': serializer.toJson<String?>(image),
      'isVariant': serializer.toJson<bool>(isVariant),
      'isBatch': serializer.toJson<bool>(isBatch),
      'isImei': serializer.toJson<bool>(isImei),
      'isEmbeded': serializer.toJson<bool>(isEmbeded),
      'featured': serializer.toJson<int>(featured),
      'updatedAt': serializer.toJson<String?>(updatedAt),
    };
  }

  Product copyWith(
          {int? id,
          String? name,
          String? code,
          String? type,
          Value<int?> brandId = const Value.absent(),
          Value<int?> categoryId = const Value.absent(),
          Value<int?> unitId = const Value.absent(),
          Value<int?> saleUnitId = const Value.absent(),
          double? cost,
          double? price,
          double? wholesalePrice,
          Value<int?> taxId = const Value.absent(),
          int? taxMethod,
          Value<String?> image = const Value.absent(),
          bool? isVariant,
          bool? isBatch,
          bool? isImei,
          bool? isEmbeded,
          int? featured,
          Value<String?> updatedAt = const Value.absent()}) =>
      Product(
        id: id ?? this.id,
        name: name ?? this.name,
        code: code ?? this.code,
        type: type ?? this.type,
        brandId: brandId.present ? brandId.value : this.brandId,
        categoryId: categoryId.present ? categoryId.value : this.categoryId,
        unitId: unitId.present ? unitId.value : this.unitId,
        saleUnitId: saleUnitId.present ? saleUnitId.value : this.saleUnitId,
        cost: cost ?? this.cost,
        price: price ?? this.price,
        wholesalePrice: wholesalePrice ?? this.wholesalePrice,
        taxId: taxId.present ? taxId.value : this.taxId,
        taxMethod: taxMethod ?? this.taxMethod,
        image: image.present ? image.value : this.image,
        isVariant: isVariant ?? this.isVariant,
        isBatch: isBatch ?? this.isBatch,
        isImei: isImei ?? this.isImei,
        isEmbeded: isEmbeded ?? this.isEmbeded,
        featured: featured ?? this.featured,
        updatedAt: updatedAt.present ? updatedAt.value : this.updatedAt,
      );
  Product copyWithCompanion(ProductsCompanion data) {
    return Product(
      id: data.id.present ? data.id.value : this.id,
      name: data.name.present ? data.name.value : this.name,
      code: data.code.present ? data.code.value : this.code,
      type: data.type.present ? data.type.value : this.type,
      brandId: data.brandId.present ? data.brandId.value : this.brandId,
      categoryId:
          data.categoryId.present ? data.categoryId.value : this.categoryId,
      unitId: data.unitId.present ? data.unitId.value : this.unitId,
      saleUnitId:
          data.saleUnitId.present ? data.saleUnitId.value : this.saleUnitId,
      cost: data.cost.present ? data.cost.value : this.cost,
      price: data.price.present ? data.price.value : this.price,
      wholesalePrice: data.wholesalePrice.present
          ? data.wholesalePrice.value
          : this.wholesalePrice,
      taxId: data.taxId.present ? data.taxId.value : this.taxId,
      taxMethod: data.taxMethod.present ? data.taxMethod.value : this.taxMethod,
      image: data.image.present ? data.image.value : this.image,
      isVariant: data.isVariant.present ? data.isVariant.value : this.isVariant,
      isBatch: data.isBatch.present ? data.isBatch.value : this.isBatch,
      isImei: data.isImei.present ? data.isImei.value : this.isImei,
      isEmbeded: data.isEmbeded.present ? data.isEmbeded.value : this.isEmbeded,
      featured: data.featured.present ? data.featured.value : this.featured,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('Product(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('code: $code, ')
          ..write('type: $type, ')
          ..write('brandId: $brandId, ')
          ..write('categoryId: $categoryId, ')
          ..write('unitId: $unitId, ')
          ..write('saleUnitId: $saleUnitId, ')
          ..write('cost: $cost, ')
          ..write('price: $price, ')
          ..write('wholesalePrice: $wholesalePrice, ')
          ..write('taxId: $taxId, ')
          ..write('taxMethod: $taxMethod, ')
          ..write('image: $image, ')
          ..write('isVariant: $isVariant, ')
          ..write('isBatch: $isBatch, ')
          ..write('isImei: $isImei, ')
          ..write('isEmbeded: $isEmbeded, ')
          ..write('featured: $featured, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
      id,
      name,
      code,
      type,
      brandId,
      categoryId,
      unitId,
      saleUnitId,
      cost,
      price,
      wholesalePrice,
      taxId,
      taxMethod,
      image,
      isVariant,
      isBatch,
      isImei,
      isEmbeded,
      featured,
      updatedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Product &&
          other.id == this.id &&
          other.name == this.name &&
          other.code == this.code &&
          other.type == this.type &&
          other.brandId == this.brandId &&
          other.categoryId == this.categoryId &&
          other.unitId == this.unitId &&
          other.saleUnitId == this.saleUnitId &&
          other.cost == this.cost &&
          other.price == this.price &&
          other.wholesalePrice == this.wholesalePrice &&
          other.taxId == this.taxId &&
          other.taxMethod == this.taxMethod &&
          other.image == this.image &&
          other.isVariant == this.isVariant &&
          other.isBatch == this.isBatch &&
          other.isImei == this.isImei &&
          other.isEmbeded == this.isEmbeded &&
          other.featured == this.featured &&
          other.updatedAt == this.updatedAt);
}

class ProductsCompanion extends UpdateCompanion<Product> {
  final Value<int> id;
  final Value<String> name;
  final Value<String> code;
  final Value<String> type;
  final Value<int?> brandId;
  final Value<int?> categoryId;
  final Value<int?> unitId;
  final Value<int?> saleUnitId;
  final Value<double> cost;
  final Value<double> price;
  final Value<double> wholesalePrice;
  final Value<int?> taxId;
  final Value<int> taxMethod;
  final Value<String?> image;
  final Value<bool> isVariant;
  final Value<bool> isBatch;
  final Value<bool> isImei;
  final Value<bool> isEmbeded;
  final Value<int> featured;
  final Value<String?> updatedAt;
  const ProductsCompanion({
    this.id = const Value.absent(),
    this.name = const Value.absent(),
    this.code = const Value.absent(),
    this.type = const Value.absent(),
    this.brandId = const Value.absent(),
    this.categoryId = const Value.absent(),
    this.unitId = const Value.absent(),
    this.saleUnitId = const Value.absent(),
    this.cost = const Value.absent(),
    this.price = const Value.absent(),
    this.wholesalePrice = const Value.absent(),
    this.taxId = const Value.absent(),
    this.taxMethod = const Value.absent(),
    this.image = const Value.absent(),
    this.isVariant = const Value.absent(),
    this.isBatch = const Value.absent(),
    this.isImei = const Value.absent(),
    this.isEmbeded = const Value.absent(),
    this.featured = const Value.absent(),
    this.updatedAt = const Value.absent(),
  });
  ProductsCompanion.insert({
    this.id = const Value.absent(),
    required String name,
    required String code,
    this.type = const Value.absent(),
    this.brandId = const Value.absent(),
    this.categoryId = const Value.absent(),
    this.unitId = const Value.absent(),
    this.saleUnitId = const Value.absent(),
    this.cost = const Value.absent(),
    this.price = const Value.absent(),
    this.wholesalePrice = const Value.absent(),
    this.taxId = const Value.absent(),
    this.taxMethod = const Value.absent(),
    this.image = const Value.absent(),
    this.isVariant = const Value.absent(),
    this.isBatch = const Value.absent(),
    this.isImei = const Value.absent(),
    this.isEmbeded = const Value.absent(),
    this.featured = const Value.absent(),
    this.updatedAt = const Value.absent(),
  })  : name = Value(name),
        code = Value(code);
  static Insertable<Product> custom({
    Expression<int>? id,
    Expression<String>? name,
    Expression<String>? code,
    Expression<String>? type,
    Expression<int>? brandId,
    Expression<int>? categoryId,
    Expression<int>? unitId,
    Expression<int>? saleUnitId,
    Expression<double>? cost,
    Expression<double>? price,
    Expression<double>? wholesalePrice,
    Expression<int>? taxId,
    Expression<int>? taxMethod,
    Expression<String>? image,
    Expression<bool>? isVariant,
    Expression<bool>? isBatch,
    Expression<bool>? isImei,
    Expression<bool>? isEmbeded,
    Expression<int>? featured,
    Expression<String>? updatedAt,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (name != null) 'name': name,
      if (code != null) 'code': code,
      if (type != null) 'type': type,
      if (brandId != null) 'brand_id': brandId,
      if (categoryId != null) 'category_id': categoryId,
      if (unitId != null) 'unit_id': unitId,
      if (saleUnitId != null) 'sale_unit_id': saleUnitId,
      if (cost != null) 'cost': cost,
      if (price != null) 'price': price,
      if (wholesalePrice != null) 'wholesale_price': wholesalePrice,
      if (taxId != null) 'tax_id': taxId,
      if (taxMethod != null) 'tax_method': taxMethod,
      if (image != null) 'image': image,
      if (isVariant != null) 'is_variant': isVariant,
      if (isBatch != null) 'is_batch': isBatch,
      if (isImei != null) 'is_imei': isImei,
      if (isEmbeded != null) 'is_embeded': isEmbeded,
      if (featured != null) 'featured': featured,
      if (updatedAt != null) 'updated_at': updatedAt,
    });
  }

  ProductsCompanion copyWith(
      {Value<int>? id,
      Value<String>? name,
      Value<String>? code,
      Value<String>? type,
      Value<int?>? brandId,
      Value<int?>? categoryId,
      Value<int?>? unitId,
      Value<int?>? saleUnitId,
      Value<double>? cost,
      Value<double>? price,
      Value<double>? wholesalePrice,
      Value<int?>? taxId,
      Value<int>? taxMethod,
      Value<String?>? image,
      Value<bool>? isVariant,
      Value<bool>? isBatch,
      Value<bool>? isImei,
      Value<bool>? isEmbeded,
      Value<int>? featured,
      Value<String?>? updatedAt}) {
    return ProductsCompanion(
      id: id ?? this.id,
      name: name ?? this.name,
      code: code ?? this.code,
      type: type ?? this.type,
      brandId: brandId ?? this.brandId,
      categoryId: categoryId ?? this.categoryId,
      unitId: unitId ?? this.unitId,
      saleUnitId: saleUnitId ?? this.saleUnitId,
      cost: cost ?? this.cost,
      price: price ?? this.price,
      wholesalePrice: wholesalePrice ?? this.wholesalePrice,
      taxId: taxId ?? this.taxId,
      taxMethod: taxMethod ?? this.taxMethod,
      image: image ?? this.image,
      isVariant: isVariant ?? this.isVariant,
      isBatch: isBatch ?? this.isBatch,
      isImei: isImei ?? this.isImei,
      isEmbeded: isEmbeded ?? this.isEmbeded,
      featured: featured ?? this.featured,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (code.present) {
      map['code'] = Variable<String>(code.value);
    }
    if (type.present) {
      map['type'] = Variable<String>(type.value);
    }
    if (brandId.present) {
      map['brand_id'] = Variable<int>(brandId.value);
    }
    if (categoryId.present) {
      map['category_id'] = Variable<int>(categoryId.value);
    }
    if (unitId.present) {
      map['unit_id'] = Variable<int>(unitId.value);
    }
    if (saleUnitId.present) {
      map['sale_unit_id'] = Variable<int>(saleUnitId.value);
    }
    if (cost.present) {
      map['cost'] = Variable<double>(cost.value);
    }
    if (price.present) {
      map['price'] = Variable<double>(price.value);
    }
    if (wholesalePrice.present) {
      map['wholesale_price'] = Variable<double>(wholesalePrice.value);
    }
    if (taxId.present) {
      map['tax_id'] = Variable<int>(taxId.value);
    }
    if (taxMethod.present) {
      map['tax_method'] = Variable<int>(taxMethod.value);
    }
    if (image.present) {
      map['image'] = Variable<String>(image.value);
    }
    if (isVariant.present) {
      map['is_variant'] = Variable<bool>(isVariant.value);
    }
    if (isBatch.present) {
      map['is_batch'] = Variable<bool>(isBatch.value);
    }
    if (isImei.present) {
      map['is_imei'] = Variable<bool>(isImei.value);
    }
    if (isEmbeded.present) {
      map['is_embeded'] = Variable<bool>(isEmbeded.value);
    }
    if (featured.present) {
      map['featured'] = Variable<int>(featured.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<String>(updatedAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('ProductsCompanion(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('code: $code, ')
          ..write('type: $type, ')
          ..write('brandId: $brandId, ')
          ..write('categoryId: $categoryId, ')
          ..write('unitId: $unitId, ')
          ..write('saleUnitId: $saleUnitId, ')
          ..write('cost: $cost, ')
          ..write('price: $price, ')
          ..write('wholesalePrice: $wholesalePrice, ')
          ..write('taxId: $taxId, ')
          ..write('taxMethod: $taxMethod, ')
          ..write('image: $image, ')
          ..write('isVariant: $isVariant, ')
          ..write('isBatch: $isBatch, ')
          ..write('isImei: $isImei, ')
          ..write('isEmbeded: $isEmbeded, ')
          ..write('featured: $featured, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }
}

class $ProductVariantsTable extends ProductVariants
    with TableInfo<$ProductVariantsTable, ProductVariant> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $ProductVariantsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
      'id', aliasedName, false,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _productIdMeta =
      const VerificationMeta('productId');
  @override
  late final GeneratedColumn<int> productId = GeneratedColumn<int>(
      'product_id', aliasedName, false,
      type: DriftSqlType.int, requiredDuringInsert: true);
  static const VerificationMeta _variantIdMeta =
      const VerificationMeta('variantId');
  @override
  late final GeneratedColumn<int> variantId = GeneratedColumn<int>(
      'variant_id', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _itemCodeMeta =
      const VerificationMeta('itemCode');
  @override
  late final GeneratedColumn<String> itemCode = GeneratedColumn<String>(
      'item_code', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _additionalPriceMeta =
      const VerificationMeta('additionalPrice');
  @override
  late final GeneratedColumn<double> additionalPrice = GeneratedColumn<double>(
      'additional_price', aliasedName, false,
      type: DriftSqlType.double,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _updatedAtMeta =
      const VerificationMeta('updatedAt');
  @override
  late final GeneratedColumn<String> updatedAt = GeneratedColumn<String>(
      'updated_at', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  @override
  List<GeneratedColumn> get $columns =>
      [id, productId, variantId, itemCode, additionalPrice, updatedAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'product_variants';
  @override
  VerificationContext validateIntegrity(Insertable<ProductVariant> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('product_id')) {
      context.handle(_productIdMeta,
          productId.isAcceptableOrUnknown(data['product_id']!, _productIdMeta));
    } else if (isInserting) {
      context.missing(_productIdMeta);
    }
    if (data.containsKey('variant_id')) {
      context.handle(_variantIdMeta,
          variantId.isAcceptableOrUnknown(data['variant_id']!, _variantIdMeta));
    }
    if (data.containsKey('item_code')) {
      context.handle(_itemCodeMeta,
          itemCode.isAcceptableOrUnknown(data['item_code']!, _itemCodeMeta));
    } else if (isInserting) {
      context.missing(_itemCodeMeta);
    }
    if (data.containsKey('additional_price')) {
      context.handle(
          _additionalPriceMeta,
          additionalPrice.isAcceptableOrUnknown(
              data['additional_price']!, _additionalPriceMeta));
    }
    if (data.containsKey('updated_at')) {
      context.handle(_updatedAtMeta,
          updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  ProductVariant map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return ProductVariant(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}id'])!,
      productId: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}product_id'])!,
      variantId: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}variant_id']),
      itemCode: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}item_code'])!,
      additionalPrice: attachedDatabase.typeMapping.read(
          DriftSqlType.double, data['${effectivePrefix}additional_price'])!,
      updatedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}updated_at']),
    );
  }

  @override
  $ProductVariantsTable createAlias(String alias) {
    return $ProductVariantsTable(attachedDatabase, alias);
  }
}

class ProductVariant extends DataClass implements Insertable<ProductVariant> {
  final int id;
  final int productId;
  final int? variantId;
  final String itemCode;
  final double additionalPrice;
  final String? updatedAt;
  const ProductVariant(
      {required this.id,
      required this.productId,
      this.variantId,
      required this.itemCode,
      required this.additionalPrice,
      this.updatedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['product_id'] = Variable<int>(productId);
    if (!nullToAbsent || variantId != null) {
      map['variant_id'] = Variable<int>(variantId);
    }
    map['item_code'] = Variable<String>(itemCode);
    map['additional_price'] = Variable<double>(additionalPrice);
    if (!nullToAbsent || updatedAt != null) {
      map['updated_at'] = Variable<String>(updatedAt);
    }
    return map;
  }

  ProductVariantsCompanion toCompanion(bool nullToAbsent) {
    return ProductVariantsCompanion(
      id: Value(id),
      productId: Value(productId),
      variantId: variantId == null && nullToAbsent
          ? const Value.absent()
          : Value(variantId),
      itemCode: Value(itemCode),
      additionalPrice: Value(additionalPrice),
      updatedAt: updatedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(updatedAt),
    );
  }

  factory ProductVariant.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return ProductVariant(
      id: serializer.fromJson<int>(json['id']),
      productId: serializer.fromJson<int>(json['productId']),
      variantId: serializer.fromJson<int?>(json['variantId']),
      itemCode: serializer.fromJson<String>(json['itemCode']),
      additionalPrice: serializer.fromJson<double>(json['additionalPrice']),
      updatedAt: serializer.fromJson<String?>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'productId': serializer.toJson<int>(productId),
      'variantId': serializer.toJson<int?>(variantId),
      'itemCode': serializer.toJson<String>(itemCode),
      'additionalPrice': serializer.toJson<double>(additionalPrice),
      'updatedAt': serializer.toJson<String?>(updatedAt),
    };
  }

  ProductVariant copyWith(
          {int? id,
          int? productId,
          Value<int?> variantId = const Value.absent(),
          String? itemCode,
          double? additionalPrice,
          Value<String?> updatedAt = const Value.absent()}) =>
      ProductVariant(
        id: id ?? this.id,
        productId: productId ?? this.productId,
        variantId: variantId.present ? variantId.value : this.variantId,
        itemCode: itemCode ?? this.itemCode,
        additionalPrice: additionalPrice ?? this.additionalPrice,
        updatedAt: updatedAt.present ? updatedAt.value : this.updatedAt,
      );
  ProductVariant copyWithCompanion(ProductVariantsCompanion data) {
    return ProductVariant(
      id: data.id.present ? data.id.value : this.id,
      productId: data.productId.present ? data.productId.value : this.productId,
      variantId: data.variantId.present ? data.variantId.value : this.variantId,
      itemCode: data.itemCode.present ? data.itemCode.value : this.itemCode,
      additionalPrice: data.additionalPrice.present
          ? data.additionalPrice.value
          : this.additionalPrice,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('ProductVariant(')
          ..write('id: $id, ')
          ..write('productId: $productId, ')
          ..write('variantId: $variantId, ')
          ..write('itemCode: $itemCode, ')
          ..write('additionalPrice: $additionalPrice, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
      id, productId, variantId, itemCode, additionalPrice, updatedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is ProductVariant &&
          other.id == this.id &&
          other.productId == this.productId &&
          other.variantId == this.variantId &&
          other.itemCode == this.itemCode &&
          other.additionalPrice == this.additionalPrice &&
          other.updatedAt == this.updatedAt);
}

class ProductVariantsCompanion extends UpdateCompanion<ProductVariant> {
  final Value<int> id;
  final Value<int> productId;
  final Value<int?> variantId;
  final Value<String> itemCode;
  final Value<double> additionalPrice;
  final Value<String?> updatedAt;
  const ProductVariantsCompanion({
    this.id = const Value.absent(),
    this.productId = const Value.absent(),
    this.variantId = const Value.absent(),
    this.itemCode = const Value.absent(),
    this.additionalPrice = const Value.absent(),
    this.updatedAt = const Value.absent(),
  });
  ProductVariantsCompanion.insert({
    this.id = const Value.absent(),
    required int productId,
    this.variantId = const Value.absent(),
    required String itemCode,
    this.additionalPrice = const Value.absent(),
    this.updatedAt = const Value.absent(),
  })  : productId = Value(productId),
        itemCode = Value(itemCode);
  static Insertable<ProductVariant> custom({
    Expression<int>? id,
    Expression<int>? productId,
    Expression<int>? variantId,
    Expression<String>? itemCode,
    Expression<double>? additionalPrice,
    Expression<String>? updatedAt,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (productId != null) 'product_id': productId,
      if (variantId != null) 'variant_id': variantId,
      if (itemCode != null) 'item_code': itemCode,
      if (additionalPrice != null) 'additional_price': additionalPrice,
      if (updatedAt != null) 'updated_at': updatedAt,
    });
  }

  ProductVariantsCompanion copyWith(
      {Value<int>? id,
      Value<int>? productId,
      Value<int?>? variantId,
      Value<String>? itemCode,
      Value<double>? additionalPrice,
      Value<String?>? updatedAt}) {
    return ProductVariantsCompanion(
      id: id ?? this.id,
      productId: productId ?? this.productId,
      variantId: variantId ?? this.variantId,
      itemCode: itemCode ?? this.itemCode,
      additionalPrice: additionalPrice ?? this.additionalPrice,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (productId.present) {
      map['product_id'] = Variable<int>(productId.value);
    }
    if (variantId.present) {
      map['variant_id'] = Variable<int>(variantId.value);
    }
    if (itemCode.present) {
      map['item_code'] = Variable<String>(itemCode.value);
    }
    if (additionalPrice.present) {
      map['additional_price'] = Variable<double>(additionalPrice.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<String>(updatedAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('ProductVariantsCompanion(')
          ..write('id: $id, ')
          ..write('productId: $productId, ')
          ..write('variantId: $variantId, ')
          ..write('itemCode: $itemCode, ')
          ..write('additionalPrice: $additionalPrice, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }
}

class $ProductStockTable extends ProductStock
    with TableInfo<$ProductStockTable, ProductStockData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $ProductStockTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
      'id', aliasedName, false,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _productIdMeta =
      const VerificationMeta('productId');
  @override
  late final GeneratedColumn<int> productId = GeneratedColumn<int>(
      'product_id', aliasedName, false,
      type: DriftSqlType.int, requiredDuringInsert: true);
  static const VerificationMeta _warehouseIdMeta =
      const VerificationMeta('warehouseId');
  @override
  late final GeneratedColumn<int> warehouseId = GeneratedColumn<int>(
      'warehouse_id', aliasedName, false,
      type: DriftSqlType.int, requiredDuringInsert: true);
  static const VerificationMeta _variantIdMeta =
      const VerificationMeta('variantId');
  @override
  late final GeneratedColumn<int> variantId = GeneratedColumn<int>(
      'variant_id', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _qtyMeta = const VerificationMeta('qty');
  @override
  late final GeneratedColumn<double> qty = GeneratedColumn<double>(
      'qty', aliasedName, false,
      type: DriftSqlType.double,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _priceMeta = const VerificationMeta('price');
  @override
  late final GeneratedColumn<double> price = GeneratedColumn<double>(
      'price', aliasedName, true,
      type: DriftSqlType.double, requiredDuringInsert: false);
  static const VerificationMeta _productBatchIdMeta =
      const VerificationMeta('productBatchId');
  @override
  late final GeneratedColumn<int> productBatchId = GeneratedColumn<int>(
      'product_batch_id', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _imeiNumberMeta =
      const VerificationMeta('imeiNumber');
  @override
  late final GeneratedColumn<String> imeiNumber = GeneratedColumn<String>(
      'imei_number', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _updatedAtMeta =
      const VerificationMeta('updatedAt');
  @override
  late final GeneratedColumn<String> updatedAt = GeneratedColumn<String>(
      'updated_at', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        productId,
        warehouseId,
        variantId,
        qty,
        price,
        productBatchId,
        imeiNumber,
        updatedAt
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'product_stock';
  @override
  VerificationContext validateIntegrity(Insertable<ProductStockData> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('product_id')) {
      context.handle(_productIdMeta,
          productId.isAcceptableOrUnknown(data['product_id']!, _productIdMeta));
    } else if (isInserting) {
      context.missing(_productIdMeta);
    }
    if (data.containsKey('warehouse_id')) {
      context.handle(
          _warehouseIdMeta,
          warehouseId.isAcceptableOrUnknown(
              data['warehouse_id']!, _warehouseIdMeta));
    } else if (isInserting) {
      context.missing(_warehouseIdMeta);
    }
    if (data.containsKey('variant_id')) {
      context.handle(_variantIdMeta,
          variantId.isAcceptableOrUnknown(data['variant_id']!, _variantIdMeta));
    }
    if (data.containsKey('qty')) {
      context.handle(
          _qtyMeta, qty.isAcceptableOrUnknown(data['qty']!, _qtyMeta));
    }
    if (data.containsKey('price')) {
      context.handle(
          _priceMeta, price.isAcceptableOrUnknown(data['price']!, _priceMeta));
    }
    if (data.containsKey('product_batch_id')) {
      context.handle(
          _productBatchIdMeta,
          productBatchId.isAcceptableOrUnknown(
              data['product_batch_id']!, _productBatchIdMeta));
    }
    if (data.containsKey('imei_number')) {
      context.handle(
          _imeiNumberMeta,
          imeiNumber.isAcceptableOrUnknown(
              data['imei_number']!, _imeiNumberMeta));
    }
    if (data.containsKey('updated_at')) {
      context.handle(_updatedAtMeta,
          updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  ProductStockData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return ProductStockData(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}id'])!,
      productId: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}product_id'])!,
      warehouseId: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}warehouse_id'])!,
      variantId: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}variant_id']),
      qty: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}qty'])!,
      price: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}price']),
      productBatchId: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}product_batch_id']),
      imeiNumber: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}imei_number']),
      updatedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}updated_at']),
    );
  }

  @override
  $ProductStockTable createAlias(String alias) {
    return $ProductStockTable(attachedDatabase, alias);
  }
}

class ProductStockData extends DataClass
    implements Insertable<ProductStockData> {
  final int id;
  final int productId;
  final int warehouseId;
  final int? variantId;
  final double qty;
  final double? price;
  final int? productBatchId;
  final String? imeiNumber;
  final String? updatedAt;
  const ProductStockData(
      {required this.id,
      required this.productId,
      required this.warehouseId,
      this.variantId,
      required this.qty,
      this.price,
      this.productBatchId,
      this.imeiNumber,
      this.updatedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['product_id'] = Variable<int>(productId);
    map['warehouse_id'] = Variable<int>(warehouseId);
    if (!nullToAbsent || variantId != null) {
      map['variant_id'] = Variable<int>(variantId);
    }
    map['qty'] = Variable<double>(qty);
    if (!nullToAbsent || price != null) {
      map['price'] = Variable<double>(price);
    }
    if (!nullToAbsent || productBatchId != null) {
      map['product_batch_id'] = Variable<int>(productBatchId);
    }
    if (!nullToAbsent || imeiNumber != null) {
      map['imei_number'] = Variable<String>(imeiNumber);
    }
    if (!nullToAbsent || updatedAt != null) {
      map['updated_at'] = Variable<String>(updatedAt);
    }
    return map;
  }

  ProductStockCompanion toCompanion(bool nullToAbsent) {
    return ProductStockCompanion(
      id: Value(id),
      productId: Value(productId),
      warehouseId: Value(warehouseId),
      variantId: variantId == null && nullToAbsent
          ? const Value.absent()
          : Value(variantId),
      qty: Value(qty),
      price:
          price == null && nullToAbsent ? const Value.absent() : Value(price),
      productBatchId: productBatchId == null && nullToAbsent
          ? const Value.absent()
          : Value(productBatchId),
      imeiNumber: imeiNumber == null && nullToAbsent
          ? const Value.absent()
          : Value(imeiNumber),
      updatedAt: updatedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(updatedAt),
    );
  }

  factory ProductStockData.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return ProductStockData(
      id: serializer.fromJson<int>(json['id']),
      productId: serializer.fromJson<int>(json['productId']),
      warehouseId: serializer.fromJson<int>(json['warehouseId']),
      variantId: serializer.fromJson<int?>(json['variantId']),
      qty: serializer.fromJson<double>(json['qty']),
      price: serializer.fromJson<double?>(json['price']),
      productBatchId: serializer.fromJson<int?>(json['productBatchId']),
      imeiNumber: serializer.fromJson<String?>(json['imeiNumber']),
      updatedAt: serializer.fromJson<String?>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'productId': serializer.toJson<int>(productId),
      'warehouseId': serializer.toJson<int>(warehouseId),
      'variantId': serializer.toJson<int?>(variantId),
      'qty': serializer.toJson<double>(qty),
      'price': serializer.toJson<double?>(price),
      'productBatchId': serializer.toJson<int?>(productBatchId),
      'imeiNumber': serializer.toJson<String?>(imeiNumber),
      'updatedAt': serializer.toJson<String?>(updatedAt),
    };
  }

  ProductStockData copyWith(
          {int? id,
          int? productId,
          int? warehouseId,
          Value<int?> variantId = const Value.absent(),
          double? qty,
          Value<double?> price = const Value.absent(),
          Value<int?> productBatchId = const Value.absent(),
          Value<String?> imeiNumber = const Value.absent(),
          Value<String?> updatedAt = const Value.absent()}) =>
      ProductStockData(
        id: id ?? this.id,
        productId: productId ?? this.productId,
        warehouseId: warehouseId ?? this.warehouseId,
        variantId: variantId.present ? variantId.value : this.variantId,
        qty: qty ?? this.qty,
        price: price.present ? price.value : this.price,
        productBatchId:
            productBatchId.present ? productBatchId.value : this.productBatchId,
        imeiNumber: imeiNumber.present ? imeiNumber.value : this.imeiNumber,
        updatedAt: updatedAt.present ? updatedAt.value : this.updatedAt,
      );
  ProductStockData copyWithCompanion(ProductStockCompanion data) {
    return ProductStockData(
      id: data.id.present ? data.id.value : this.id,
      productId: data.productId.present ? data.productId.value : this.productId,
      warehouseId:
          data.warehouseId.present ? data.warehouseId.value : this.warehouseId,
      variantId: data.variantId.present ? data.variantId.value : this.variantId,
      qty: data.qty.present ? data.qty.value : this.qty,
      price: data.price.present ? data.price.value : this.price,
      productBatchId: data.productBatchId.present
          ? data.productBatchId.value
          : this.productBatchId,
      imeiNumber:
          data.imeiNumber.present ? data.imeiNumber.value : this.imeiNumber,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('ProductStockData(')
          ..write('id: $id, ')
          ..write('productId: $productId, ')
          ..write('warehouseId: $warehouseId, ')
          ..write('variantId: $variantId, ')
          ..write('qty: $qty, ')
          ..write('price: $price, ')
          ..write('productBatchId: $productBatchId, ')
          ..write('imeiNumber: $imeiNumber, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, productId, warehouseId, variantId, qty,
      price, productBatchId, imeiNumber, updatedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is ProductStockData &&
          other.id == this.id &&
          other.productId == this.productId &&
          other.warehouseId == this.warehouseId &&
          other.variantId == this.variantId &&
          other.qty == this.qty &&
          other.price == this.price &&
          other.productBatchId == this.productBatchId &&
          other.imeiNumber == this.imeiNumber &&
          other.updatedAt == this.updatedAt);
}

class ProductStockCompanion extends UpdateCompanion<ProductStockData> {
  final Value<int> id;
  final Value<int> productId;
  final Value<int> warehouseId;
  final Value<int?> variantId;
  final Value<double> qty;
  final Value<double?> price;
  final Value<int?> productBatchId;
  final Value<String?> imeiNumber;
  final Value<String?> updatedAt;
  const ProductStockCompanion({
    this.id = const Value.absent(),
    this.productId = const Value.absent(),
    this.warehouseId = const Value.absent(),
    this.variantId = const Value.absent(),
    this.qty = const Value.absent(),
    this.price = const Value.absent(),
    this.productBatchId = const Value.absent(),
    this.imeiNumber = const Value.absent(),
    this.updatedAt = const Value.absent(),
  });
  ProductStockCompanion.insert({
    this.id = const Value.absent(),
    required int productId,
    required int warehouseId,
    this.variantId = const Value.absent(),
    this.qty = const Value.absent(),
    this.price = const Value.absent(),
    this.productBatchId = const Value.absent(),
    this.imeiNumber = const Value.absent(),
    this.updatedAt = const Value.absent(),
  })  : productId = Value(productId),
        warehouseId = Value(warehouseId);
  static Insertable<ProductStockData> custom({
    Expression<int>? id,
    Expression<int>? productId,
    Expression<int>? warehouseId,
    Expression<int>? variantId,
    Expression<double>? qty,
    Expression<double>? price,
    Expression<int>? productBatchId,
    Expression<String>? imeiNumber,
    Expression<String>? updatedAt,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (productId != null) 'product_id': productId,
      if (warehouseId != null) 'warehouse_id': warehouseId,
      if (variantId != null) 'variant_id': variantId,
      if (qty != null) 'qty': qty,
      if (price != null) 'price': price,
      if (productBatchId != null) 'product_batch_id': productBatchId,
      if (imeiNumber != null) 'imei_number': imeiNumber,
      if (updatedAt != null) 'updated_at': updatedAt,
    });
  }

  ProductStockCompanion copyWith(
      {Value<int>? id,
      Value<int>? productId,
      Value<int>? warehouseId,
      Value<int?>? variantId,
      Value<double>? qty,
      Value<double?>? price,
      Value<int?>? productBatchId,
      Value<String?>? imeiNumber,
      Value<String?>? updatedAt}) {
    return ProductStockCompanion(
      id: id ?? this.id,
      productId: productId ?? this.productId,
      warehouseId: warehouseId ?? this.warehouseId,
      variantId: variantId ?? this.variantId,
      qty: qty ?? this.qty,
      price: price ?? this.price,
      productBatchId: productBatchId ?? this.productBatchId,
      imeiNumber: imeiNumber ?? this.imeiNumber,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (productId.present) {
      map['product_id'] = Variable<int>(productId.value);
    }
    if (warehouseId.present) {
      map['warehouse_id'] = Variable<int>(warehouseId.value);
    }
    if (variantId.present) {
      map['variant_id'] = Variable<int>(variantId.value);
    }
    if (qty.present) {
      map['qty'] = Variable<double>(qty.value);
    }
    if (price.present) {
      map['price'] = Variable<double>(price.value);
    }
    if (productBatchId.present) {
      map['product_batch_id'] = Variable<int>(productBatchId.value);
    }
    if (imeiNumber.present) {
      map['imei_number'] = Variable<String>(imeiNumber.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<String>(updatedAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('ProductStockCompanion(')
          ..write('id: $id, ')
          ..write('productId: $productId, ')
          ..write('warehouseId: $warehouseId, ')
          ..write('variantId: $variantId, ')
          ..write('qty: $qty, ')
          ..write('price: $price, ')
          ..write('productBatchId: $productBatchId, ')
          ..write('imeiNumber: $imeiNumber, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }
}

class $LocalSalesTable extends LocalSales
    with TableInfo<$LocalSalesTable, LocalSale> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalSalesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
      'id', aliasedName, false,
      hasAutoIncrement: true,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('PRIMARY KEY AUTOINCREMENT'));
  static const VerificationMeta _clientUuidMeta =
      const VerificationMeta('clientUuid');
  @override
  late final GeneratedColumn<String> clientUuid = GeneratedColumn<String>(
      'client_uuid', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: true,
      defaultConstraints: GeneratedColumn.constraintIsAlways('UNIQUE'));
  static const VerificationMeta _warehouseIdMeta =
      const VerificationMeta('warehouseId');
  @override
  late final GeneratedColumn<int> warehouseId = GeneratedColumn<int>(
      'warehouse_id', aliasedName, false,
      type: DriftSqlType.int, requiredDuringInsert: true);
  static const VerificationMeta _customerIdMeta =
      const VerificationMeta('customerId');
  @override
  late final GeneratedColumn<int> customerId = GeneratedColumn<int>(
      'customer_id', aliasedName, false,
      type: DriftSqlType.int, requiredDuringInsert: true);
  static const VerificationMeta _billerIdMeta =
      const VerificationMeta('billerId');
  @override
  late final GeneratedColumn<int> billerId = GeneratedColumn<int>(
      'biller_id', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _referenceNoMeta =
      const VerificationMeta('referenceNo');
  @override
  late final GeneratedColumn<String> referenceNo = GeneratedColumn<String>(
      'reference_no', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _itemCountMeta =
      const VerificationMeta('itemCount');
  @override
  late final GeneratedColumn<int> itemCount = GeneratedColumn<int>(
      'item_count', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _totalQtyMeta =
      const VerificationMeta('totalQty');
  @override
  late final GeneratedColumn<double> totalQty = GeneratedColumn<double>(
      'total_qty', aliasedName, false,
      type: DriftSqlType.double,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _totalDiscountMeta =
      const VerificationMeta('totalDiscount');
  @override
  late final GeneratedColumn<double> totalDiscount = GeneratedColumn<double>(
      'total_discount', aliasedName, false,
      type: DriftSqlType.double,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _totalTaxMeta =
      const VerificationMeta('totalTax');
  @override
  late final GeneratedColumn<double> totalTax = GeneratedColumn<double>(
      'total_tax', aliasedName, false,
      type: DriftSqlType.double,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _grandTotalMeta =
      const VerificationMeta('grandTotal');
  @override
  late final GeneratedColumn<double> grandTotal = GeneratedColumn<double>(
      'grand_total', aliasedName, false,
      type: DriftSqlType.double, requiredDuringInsert: true);
  static const VerificationMeta _paidAmountMeta =
      const VerificationMeta('paidAmount');
  @override
  late final GeneratedColumn<double> paidAmount = GeneratedColumn<double>(
      'paid_amount', aliasedName, false,
      type: DriftSqlType.double,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _saleStatusMeta =
      const VerificationMeta('saleStatus');
  @override
  late final GeneratedColumn<int> saleStatus = GeneratedColumn<int>(
      'sale_status', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(1));
  static const VerificationMeta _paymentStatusMeta =
      const VerificationMeta('paymentStatus');
  @override
  late final GeneratedColumn<int> paymentStatus = GeneratedColumn<int>(
      'payment_status', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(4));
  static const VerificationMeta _orderTaxRateMeta =
      const VerificationMeta('orderTaxRate');
  @override
  late final GeneratedColumn<double> orderTaxRate = GeneratedColumn<double>(
      'order_tax_rate', aliasedName, false,
      type: DriftSqlType.double,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _orderDiscountMeta =
      const VerificationMeta('orderDiscount');
  @override
  late final GeneratedColumn<double> orderDiscount = GeneratedColumn<double>(
      'order_discount', aliasedName, false,
      type: DriftSqlType.double,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _shippingCostMeta =
      const VerificationMeta('shippingCost');
  @override
  late final GeneratedColumn<double> shippingCost = GeneratedColumn<double>(
      'shipping_cost', aliasedName, false,
      type: DriftSqlType.double,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _couponIdMeta =
      const VerificationMeta('couponId');
  @override
  late final GeneratedColumn<int> couponId = GeneratedColumn<int>(
      'coupon_id', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _couponActiveMeta =
      const VerificationMeta('couponActive');
  @override
  late final GeneratedColumn<bool> couponActive = GeneratedColumn<bool>(
      'coupon_active', aliasedName, false,
      type: DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints: GeneratedColumn.constraintIsAlways(
          'CHECK ("coupon_active" IN (0, 1))'),
      defaultValue: const Constant(false));
  static const VerificationMeta _payloadJsonMeta =
      const VerificationMeta('payloadJson');
  @override
  late final GeneratedColumn<String> payloadJson = GeneratedColumn<String>(
      'payload_json', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _syncStatusMeta =
      const VerificationMeta('syncStatus');
  @override
  late final GeneratedColumn<String> syncStatus = GeneratedColumn<String>(
      'sync_status', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant('pending'));
  static const VerificationMeta _serverSaleIdMeta =
      const VerificationMeta('serverSaleId');
  @override
  late final GeneratedColumn<int> serverSaleId = GeneratedColumn<int>(
      'server_sale_id', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _serverReferenceNoMeta =
      const VerificationMeta('serverReferenceNo');
  @override
  late final GeneratedColumn<String> serverReferenceNo =
      GeneratedColumn<String>('server_reference_no', aliasedName, true,
          type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _errorMessageMeta =
      const VerificationMeta('errorMessage');
  @override
  late final GeneratedColumn<String> errorMessage = GeneratedColumn<String>(
      'error_message', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _createdAtMeta =
      const VerificationMeta('createdAt');
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
      'created_at', aliasedName, false,
      type: DriftSqlType.dateTime,
      requiredDuringInsert: false,
      defaultValue: currentDateAndTime);
  static const VerificationMeta _syncedAtMeta =
      const VerificationMeta('syncedAt');
  @override
  late final GeneratedColumn<DateTime> syncedAt = GeneratedColumn<DateTime>(
      'synced_at', aliasedName, true,
      type: DriftSqlType.dateTime, requiredDuringInsert: false);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        clientUuid,
        warehouseId,
        customerId,
        billerId,
        referenceNo,
        itemCount,
        totalQty,
        totalDiscount,
        totalTax,
        grandTotal,
        paidAmount,
        saleStatus,
        paymentStatus,
        orderTaxRate,
        orderDiscount,
        shippingCost,
        couponId,
        couponActive,
        payloadJson,
        syncStatus,
        serverSaleId,
        serverReferenceNo,
        errorMessage,
        createdAt,
        syncedAt
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_sales';
  @override
  VerificationContext validateIntegrity(Insertable<LocalSale> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('client_uuid')) {
      context.handle(
          _clientUuidMeta,
          clientUuid.isAcceptableOrUnknown(
              data['client_uuid']!, _clientUuidMeta));
    } else if (isInserting) {
      context.missing(_clientUuidMeta);
    }
    if (data.containsKey('warehouse_id')) {
      context.handle(
          _warehouseIdMeta,
          warehouseId.isAcceptableOrUnknown(
              data['warehouse_id']!, _warehouseIdMeta));
    } else if (isInserting) {
      context.missing(_warehouseIdMeta);
    }
    if (data.containsKey('customer_id')) {
      context.handle(
          _customerIdMeta,
          customerId.isAcceptableOrUnknown(
              data['customer_id']!, _customerIdMeta));
    } else if (isInserting) {
      context.missing(_customerIdMeta);
    }
    if (data.containsKey('biller_id')) {
      context.handle(_billerIdMeta,
          billerId.isAcceptableOrUnknown(data['biller_id']!, _billerIdMeta));
    }
    if (data.containsKey('reference_no')) {
      context.handle(
          _referenceNoMeta,
          referenceNo.isAcceptableOrUnknown(
              data['reference_no']!, _referenceNoMeta));
    }
    if (data.containsKey('item_count')) {
      context.handle(_itemCountMeta,
          itemCount.isAcceptableOrUnknown(data['item_count']!, _itemCountMeta));
    }
    if (data.containsKey('total_qty')) {
      context.handle(_totalQtyMeta,
          totalQty.isAcceptableOrUnknown(data['total_qty']!, _totalQtyMeta));
    }
    if (data.containsKey('total_discount')) {
      context.handle(
          _totalDiscountMeta,
          totalDiscount.isAcceptableOrUnknown(
              data['total_discount']!, _totalDiscountMeta));
    }
    if (data.containsKey('total_tax')) {
      context.handle(_totalTaxMeta,
          totalTax.isAcceptableOrUnknown(data['total_tax']!, _totalTaxMeta));
    }
    if (data.containsKey('grand_total')) {
      context.handle(
          _grandTotalMeta,
          grandTotal.isAcceptableOrUnknown(
              data['grand_total']!, _grandTotalMeta));
    } else if (isInserting) {
      context.missing(_grandTotalMeta);
    }
    if (data.containsKey('paid_amount')) {
      context.handle(
          _paidAmountMeta,
          paidAmount.isAcceptableOrUnknown(
              data['paid_amount']!, _paidAmountMeta));
    }
    if (data.containsKey('sale_status')) {
      context.handle(
          _saleStatusMeta,
          saleStatus.isAcceptableOrUnknown(
              data['sale_status']!, _saleStatusMeta));
    }
    if (data.containsKey('payment_status')) {
      context.handle(
          _paymentStatusMeta,
          paymentStatus.isAcceptableOrUnknown(
              data['payment_status']!, _paymentStatusMeta));
    }
    if (data.containsKey('order_tax_rate')) {
      context.handle(
          _orderTaxRateMeta,
          orderTaxRate.isAcceptableOrUnknown(
              data['order_tax_rate']!, _orderTaxRateMeta));
    }
    if (data.containsKey('order_discount')) {
      context.handle(
          _orderDiscountMeta,
          orderDiscount.isAcceptableOrUnknown(
              data['order_discount']!, _orderDiscountMeta));
    }
    if (data.containsKey('shipping_cost')) {
      context.handle(
          _shippingCostMeta,
          shippingCost.isAcceptableOrUnknown(
              data['shipping_cost']!, _shippingCostMeta));
    }
    if (data.containsKey('coupon_id')) {
      context.handle(_couponIdMeta,
          couponId.isAcceptableOrUnknown(data['coupon_id']!, _couponIdMeta));
    }
    if (data.containsKey('coupon_active')) {
      context.handle(
          _couponActiveMeta,
          couponActive.isAcceptableOrUnknown(
              data['coupon_active']!, _couponActiveMeta));
    }
    if (data.containsKey('payload_json')) {
      context.handle(
          _payloadJsonMeta,
          payloadJson.isAcceptableOrUnknown(
              data['payload_json']!, _payloadJsonMeta));
    }
    if (data.containsKey('sync_status')) {
      context.handle(
          _syncStatusMeta,
          syncStatus.isAcceptableOrUnknown(
              data['sync_status']!, _syncStatusMeta));
    }
    if (data.containsKey('server_sale_id')) {
      context.handle(
          _serverSaleIdMeta,
          serverSaleId.isAcceptableOrUnknown(
              data['server_sale_id']!, _serverSaleIdMeta));
    }
    if (data.containsKey('server_reference_no')) {
      context.handle(
          _serverReferenceNoMeta,
          serverReferenceNo.isAcceptableOrUnknown(
              data['server_reference_no']!, _serverReferenceNoMeta));
    }
    if (data.containsKey('error_message')) {
      context.handle(
          _errorMessageMeta,
          errorMessage.isAcceptableOrUnknown(
              data['error_message']!, _errorMessageMeta));
    }
    if (data.containsKey('created_at')) {
      context.handle(_createdAtMeta,
          createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta));
    }
    if (data.containsKey('synced_at')) {
      context.handle(_syncedAtMeta,
          syncedAt.isAcceptableOrUnknown(data['synced_at']!, _syncedAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalSale map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalSale(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}id'])!,
      clientUuid: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}client_uuid'])!,
      warehouseId: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}warehouse_id'])!,
      customerId: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}customer_id'])!,
      billerId: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}biller_id']),
      referenceNo: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}reference_no']),
      itemCount: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}item_count'])!,
      totalQty: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}total_qty'])!,
      totalDiscount: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}total_discount'])!,
      totalTax: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}total_tax'])!,
      grandTotal: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}grand_total'])!,
      paidAmount: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}paid_amount'])!,
      saleStatus: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}sale_status'])!,
      paymentStatus: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}payment_status'])!,
      orderTaxRate: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}order_tax_rate'])!,
      orderDiscount: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}order_discount'])!,
      shippingCost: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}shipping_cost'])!,
      couponId: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}coupon_id']),
      couponActive: attachedDatabase.typeMapping
          .read(DriftSqlType.bool, data['${effectivePrefix}coupon_active'])!,
      payloadJson: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}payload_json']),
      syncStatus: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}sync_status'])!,
      serverSaleId: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}server_sale_id']),
      serverReferenceNo: attachedDatabase.typeMapping.read(
          DriftSqlType.string, data['${effectivePrefix}server_reference_no']),
      errorMessage: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}error_message']),
      createdAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}created_at'])!,
      syncedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}synced_at']),
    );
  }

  @override
  $LocalSalesTable createAlias(String alias) {
    return $LocalSalesTable(attachedDatabase, alias);
  }
}

class LocalSale extends DataClass implements Insertable<LocalSale> {
  final int id;
  final String clientUuid;
  final int warehouseId;
  final int customerId;
  final int? billerId;
  final String? referenceNo;
  final int itemCount;
  final double totalQty;
  final double totalDiscount;
  final double totalTax;
  final double grandTotal;
  final double paidAmount;
  final int saleStatus;
  final int paymentStatus;
  final double orderTaxRate;
  final double orderDiscount;
  final double shippingCost;
  final int? couponId;
  final bool couponActive;
  final String? payloadJson;
  final String syncStatus;
  final int? serverSaleId;
  final String? serverReferenceNo;
  final String? errorMessage;
  final DateTime createdAt;
  final DateTime? syncedAt;
  const LocalSale(
      {required this.id,
      required this.clientUuid,
      required this.warehouseId,
      required this.customerId,
      this.billerId,
      this.referenceNo,
      required this.itemCount,
      required this.totalQty,
      required this.totalDiscount,
      required this.totalTax,
      required this.grandTotal,
      required this.paidAmount,
      required this.saleStatus,
      required this.paymentStatus,
      required this.orderTaxRate,
      required this.orderDiscount,
      required this.shippingCost,
      this.couponId,
      required this.couponActive,
      this.payloadJson,
      required this.syncStatus,
      this.serverSaleId,
      this.serverReferenceNo,
      this.errorMessage,
      required this.createdAt,
      this.syncedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['client_uuid'] = Variable<String>(clientUuid);
    map['warehouse_id'] = Variable<int>(warehouseId);
    map['customer_id'] = Variable<int>(customerId);
    if (!nullToAbsent || billerId != null) {
      map['biller_id'] = Variable<int>(billerId);
    }
    if (!nullToAbsent || referenceNo != null) {
      map['reference_no'] = Variable<String>(referenceNo);
    }
    map['item_count'] = Variable<int>(itemCount);
    map['total_qty'] = Variable<double>(totalQty);
    map['total_discount'] = Variable<double>(totalDiscount);
    map['total_tax'] = Variable<double>(totalTax);
    map['grand_total'] = Variable<double>(grandTotal);
    map['paid_amount'] = Variable<double>(paidAmount);
    map['sale_status'] = Variable<int>(saleStatus);
    map['payment_status'] = Variable<int>(paymentStatus);
    map['order_tax_rate'] = Variable<double>(orderTaxRate);
    map['order_discount'] = Variable<double>(orderDiscount);
    map['shipping_cost'] = Variable<double>(shippingCost);
    if (!nullToAbsent || couponId != null) {
      map['coupon_id'] = Variable<int>(couponId);
    }
    map['coupon_active'] = Variable<bool>(couponActive);
    if (!nullToAbsent || payloadJson != null) {
      map['payload_json'] = Variable<String>(payloadJson);
    }
    map['sync_status'] = Variable<String>(syncStatus);
    if (!nullToAbsent || serverSaleId != null) {
      map['server_sale_id'] = Variable<int>(serverSaleId);
    }
    if (!nullToAbsent || serverReferenceNo != null) {
      map['server_reference_no'] = Variable<String>(serverReferenceNo);
    }
    if (!nullToAbsent || errorMessage != null) {
      map['error_message'] = Variable<String>(errorMessage);
    }
    map['created_at'] = Variable<DateTime>(createdAt);
    if (!nullToAbsent || syncedAt != null) {
      map['synced_at'] = Variable<DateTime>(syncedAt);
    }
    return map;
  }

  LocalSalesCompanion toCompanion(bool nullToAbsent) {
    return LocalSalesCompanion(
      id: Value(id),
      clientUuid: Value(clientUuid),
      warehouseId: Value(warehouseId),
      customerId: Value(customerId),
      billerId: billerId == null && nullToAbsent
          ? const Value.absent()
          : Value(billerId),
      referenceNo: referenceNo == null && nullToAbsent
          ? const Value.absent()
          : Value(referenceNo),
      itemCount: Value(itemCount),
      totalQty: Value(totalQty),
      totalDiscount: Value(totalDiscount),
      totalTax: Value(totalTax),
      grandTotal: Value(grandTotal),
      paidAmount: Value(paidAmount),
      saleStatus: Value(saleStatus),
      paymentStatus: Value(paymentStatus),
      orderTaxRate: Value(orderTaxRate),
      orderDiscount: Value(orderDiscount),
      shippingCost: Value(shippingCost),
      couponId: couponId == null && nullToAbsent
          ? const Value.absent()
          : Value(couponId),
      couponActive: Value(couponActive),
      payloadJson: payloadJson == null && nullToAbsent
          ? const Value.absent()
          : Value(payloadJson),
      syncStatus: Value(syncStatus),
      serverSaleId: serverSaleId == null && nullToAbsent
          ? const Value.absent()
          : Value(serverSaleId),
      serverReferenceNo: serverReferenceNo == null && nullToAbsent
          ? const Value.absent()
          : Value(serverReferenceNo),
      errorMessage: errorMessage == null && nullToAbsent
          ? const Value.absent()
          : Value(errorMessage),
      createdAt: Value(createdAt),
      syncedAt: syncedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(syncedAt),
    );
  }

  factory LocalSale.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalSale(
      id: serializer.fromJson<int>(json['id']),
      clientUuid: serializer.fromJson<String>(json['clientUuid']),
      warehouseId: serializer.fromJson<int>(json['warehouseId']),
      customerId: serializer.fromJson<int>(json['customerId']),
      billerId: serializer.fromJson<int?>(json['billerId']),
      referenceNo: serializer.fromJson<String?>(json['referenceNo']),
      itemCount: serializer.fromJson<int>(json['itemCount']),
      totalQty: serializer.fromJson<double>(json['totalQty']),
      totalDiscount: serializer.fromJson<double>(json['totalDiscount']),
      totalTax: serializer.fromJson<double>(json['totalTax']),
      grandTotal: serializer.fromJson<double>(json['grandTotal']),
      paidAmount: serializer.fromJson<double>(json['paidAmount']),
      saleStatus: serializer.fromJson<int>(json['saleStatus']),
      paymentStatus: serializer.fromJson<int>(json['paymentStatus']),
      orderTaxRate: serializer.fromJson<double>(json['orderTaxRate']),
      orderDiscount: serializer.fromJson<double>(json['orderDiscount']),
      shippingCost: serializer.fromJson<double>(json['shippingCost']),
      couponId: serializer.fromJson<int?>(json['couponId']),
      couponActive: serializer.fromJson<bool>(json['couponActive']),
      payloadJson: serializer.fromJson<String?>(json['payloadJson']),
      syncStatus: serializer.fromJson<String>(json['syncStatus']),
      serverSaleId: serializer.fromJson<int?>(json['serverSaleId']),
      serverReferenceNo:
          serializer.fromJson<String?>(json['serverReferenceNo']),
      errorMessage: serializer.fromJson<String?>(json['errorMessage']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      syncedAt: serializer.fromJson<DateTime?>(json['syncedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'clientUuid': serializer.toJson<String>(clientUuid),
      'warehouseId': serializer.toJson<int>(warehouseId),
      'customerId': serializer.toJson<int>(customerId),
      'billerId': serializer.toJson<int?>(billerId),
      'referenceNo': serializer.toJson<String?>(referenceNo),
      'itemCount': serializer.toJson<int>(itemCount),
      'totalQty': serializer.toJson<double>(totalQty),
      'totalDiscount': serializer.toJson<double>(totalDiscount),
      'totalTax': serializer.toJson<double>(totalTax),
      'grandTotal': serializer.toJson<double>(grandTotal),
      'paidAmount': serializer.toJson<double>(paidAmount),
      'saleStatus': serializer.toJson<int>(saleStatus),
      'paymentStatus': serializer.toJson<int>(paymentStatus),
      'orderTaxRate': serializer.toJson<double>(orderTaxRate),
      'orderDiscount': serializer.toJson<double>(orderDiscount),
      'shippingCost': serializer.toJson<double>(shippingCost),
      'couponId': serializer.toJson<int?>(couponId),
      'couponActive': serializer.toJson<bool>(couponActive),
      'payloadJson': serializer.toJson<String?>(payloadJson),
      'syncStatus': serializer.toJson<String>(syncStatus),
      'serverSaleId': serializer.toJson<int?>(serverSaleId),
      'serverReferenceNo': serializer.toJson<String?>(serverReferenceNo),
      'errorMessage': serializer.toJson<String?>(errorMessage),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'syncedAt': serializer.toJson<DateTime?>(syncedAt),
    };
  }

  LocalSale copyWith(
          {int? id,
          String? clientUuid,
          int? warehouseId,
          int? customerId,
          Value<int?> billerId = const Value.absent(),
          Value<String?> referenceNo = const Value.absent(),
          int? itemCount,
          double? totalQty,
          double? totalDiscount,
          double? totalTax,
          double? grandTotal,
          double? paidAmount,
          int? saleStatus,
          int? paymentStatus,
          double? orderTaxRate,
          double? orderDiscount,
          double? shippingCost,
          Value<int?> couponId = const Value.absent(),
          bool? couponActive,
          Value<String?> payloadJson = const Value.absent(),
          String? syncStatus,
          Value<int?> serverSaleId = const Value.absent(),
          Value<String?> serverReferenceNo = const Value.absent(),
          Value<String?> errorMessage = const Value.absent(),
          DateTime? createdAt,
          Value<DateTime?> syncedAt = const Value.absent()}) =>
      LocalSale(
        id: id ?? this.id,
        clientUuid: clientUuid ?? this.clientUuid,
        warehouseId: warehouseId ?? this.warehouseId,
        customerId: customerId ?? this.customerId,
        billerId: billerId.present ? billerId.value : this.billerId,
        referenceNo: referenceNo.present ? referenceNo.value : this.referenceNo,
        itemCount: itemCount ?? this.itemCount,
        totalQty: totalQty ?? this.totalQty,
        totalDiscount: totalDiscount ?? this.totalDiscount,
        totalTax: totalTax ?? this.totalTax,
        grandTotal: grandTotal ?? this.grandTotal,
        paidAmount: paidAmount ?? this.paidAmount,
        saleStatus: saleStatus ?? this.saleStatus,
        paymentStatus: paymentStatus ?? this.paymentStatus,
        orderTaxRate: orderTaxRate ?? this.orderTaxRate,
        orderDiscount: orderDiscount ?? this.orderDiscount,
        shippingCost: shippingCost ?? this.shippingCost,
        couponId: couponId.present ? couponId.value : this.couponId,
        couponActive: couponActive ?? this.couponActive,
        payloadJson: payloadJson.present ? payloadJson.value : this.payloadJson,
        syncStatus: syncStatus ?? this.syncStatus,
        serverSaleId:
            serverSaleId.present ? serverSaleId.value : this.serverSaleId,
        serverReferenceNo: serverReferenceNo.present
            ? serverReferenceNo.value
            : this.serverReferenceNo,
        errorMessage:
            errorMessage.present ? errorMessage.value : this.errorMessage,
        createdAt: createdAt ?? this.createdAt,
        syncedAt: syncedAt.present ? syncedAt.value : this.syncedAt,
      );
  LocalSale copyWithCompanion(LocalSalesCompanion data) {
    return LocalSale(
      id: data.id.present ? data.id.value : this.id,
      clientUuid:
          data.clientUuid.present ? data.clientUuid.value : this.clientUuid,
      warehouseId:
          data.warehouseId.present ? data.warehouseId.value : this.warehouseId,
      customerId:
          data.customerId.present ? data.customerId.value : this.customerId,
      billerId: data.billerId.present ? data.billerId.value : this.billerId,
      referenceNo:
          data.referenceNo.present ? data.referenceNo.value : this.referenceNo,
      itemCount: data.itemCount.present ? data.itemCount.value : this.itemCount,
      totalQty: data.totalQty.present ? data.totalQty.value : this.totalQty,
      totalDiscount: data.totalDiscount.present
          ? data.totalDiscount.value
          : this.totalDiscount,
      totalTax: data.totalTax.present ? data.totalTax.value : this.totalTax,
      grandTotal:
          data.grandTotal.present ? data.grandTotal.value : this.grandTotal,
      paidAmount:
          data.paidAmount.present ? data.paidAmount.value : this.paidAmount,
      saleStatus:
          data.saleStatus.present ? data.saleStatus.value : this.saleStatus,
      paymentStatus: data.paymentStatus.present
          ? data.paymentStatus.value
          : this.paymentStatus,
      orderTaxRate: data.orderTaxRate.present
          ? data.orderTaxRate.value
          : this.orderTaxRate,
      orderDiscount: data.orderDiscount.present
          ? data.orderDiscount.value
          : this.orderDiscount,
      shippingCost: data.shippingCost.present
          ? data.shippingCost.value
          : this.shippingCost,
      couponId: data.couponId.present ? data.couponId.value : this.couponId,
      couponActive: data.couponActive.present
          ? data.couponActive.value
          : this.couponActive,
      payloadJson:
          data.payloadJson.present ? data.payloadJson.value : this.payloadJson,
      syncStatus:
          data.syncStatus.present ? data.syncStatus.value : this.syncStatus,
      serverSaleId: data.serverSaleId.present
          ? data.serverSaleId.value
          : this.serverSaleId,
      serverReferenceNo: data.serverReferenceNo.present
          ? data.serverReferenceNo.value
          : this.serverReferenceNo,
      errorMessage: data.errorMessage.present
          ? data.errorMessage.value
          : this.errorMessage,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      syncedAt: data.syncedAt.present ? data.syncedAt.value : this.syncedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalSale(')
          ..write('id: $id, ')
          ..write('clientUuid: $clientUuid, ')
          ..write('warehouseId: $warehouseId, ')
          ..write('customerId: $customerId, ')
          ..write('billerId: $billerId, ')
          ..write('referenceNo: $referenceNo, ')
          ..write('itemCount: $itemCount, ')
          ..write('totalQty: $totalQty, ')
          ..write('totalDiscount: $totalDiscount, ')
          ..write('totalTax: $totalTax, ')
          ..write('grandTotal: $grandTotal, ')
          ..write('paidAmount: $paidAmount, ')
          ..write('saleStatus: $saleStatus, ')
          ..write('paymentStatus: $paymentStatus, ')
          ..write('orderTaxRate: $orderTaxRate, ')
          ..write('orderDiscount: $orderDiscount, ')
          ..write('shippingCost: $shippingCost, ')
          ..write('couponId: $couponId, ')
          ..write('couponActive: $couponActive, ')
          ..write('payloadJson: $payloadJson, ')
          ..write('syncStatus: $syncStatus, ')
          ..write('serverSaleId: $serverSaleId, ')
          ..write('serverReferenceNo: $serverReferenceNo, ')
          ..write('errorMessage: $errorMessage, ')
          ..write('createdAt: $createdAt, ')
          ..write('syncedAt: $syncedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hashAll([
        id,
        clientUuid,
        warehouseId,
        customerId,
        billerId,
        referenceNo,
        itemCount,
        totalQty,
        totalDiscount,
        totalTax,
        grandTotal,
        paidAmount,
        saleStatus,
        paymentStatus,
        orderTaxRate,
        orderDiscount,
        shippingCost,
        couponId,
        couponActive,
        payloadJson,
        syncStatus,
        serverSaleId,
        serverReferenceNo,
        errorMessage,
        createdAt,
        syncedAt
      ]);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalSale &&
          other.id == this.id &&
          other.clientUuid == this.clientUuid &&
          other.warehouseId == this.warehouseId &&
          other.customerId == this.customerId &&
          other.billerId == this.billerId &&
          other.referenceNo == this.referenceNo &&
          other.itemCount == this.itemCount &&
          other.totalQty == this.totalQty &&
          other.totalDiscount == this.totalDiscount &&
          other.totalTax == this.totalTax &&
          other.grandTotal == this.grandTotal &&
          other.paidAmount == this.paidAmount &&
          other.saleStatus == this.saleStatus &&
          other.paymentStatus == this.paymentStatus &&
          other.orderTaxRate == this.orderTaxRate &&
          other.orderDiscount == this.orderDiscount &&
          other.shippingCost == this.shippingCost &&
          other.couponId == this.couponId &&
          other.couponActive == this.couponActive &&
          other.payloadJson == this.payloadJson &&
          other.syncStatus == this.syncStatus &&
          other.serverSaleId == this.serverSaleId &&
          other.serverReferenceNo == this.serverReferenceNo &&
          other.errorMessage == this.errorMessage &&
          other.createdAt == this.createdAt &&
          other.syncedAt == this.syncedAt);
}

class LocalSalesCompanion extends UpdateCompanion<LocalSale> {
  final Value<int> id;
  final Value<String> clientUuid;
  final Value<int> warehouseId;
  final Value<int> customerId;
  final Value<int?> billerId;
  final Value<String?> referenceNo;
  final Value<int> itemCount;
  final Value<double> totalQty;
  final Value<double> totalDiscount;
  final Value<double> totalTax;
  final Value<double> grandTotal;
  final Value<double> paidAmount;
  final Value<int> saleStatus;
  final Value<int> paymentStatus;
  final Value<double> orderTaxRate;
  final Value<double> orderDiscount;
  final Value<double> shippingCost;
  final Value<int?> couponId;
  final Value<bool> couponActive;
  final Value<String?> payloadJson;
  final Value<String> syncStatus;
  final Value<int?> serverSaleId;
  final Value<String?> serverReferenceNo;
  final Value<String?> errorMessage;
  final Value<DateTime> createdAt;
  final Value<DateTime?> syncedAt;
  const LocalSalesCompanion({
    this.id = const Value.absent(),
    this.clientUuid = const Value.absent(),
    this.warehouseId = const Value.absent(),
    this.customerId = const Value.absent(),
    this.billerId = const Value.absent(),
    this.referenceNo = const Value.absent(),
    this.itemCount = const Value.absent(),
    this.totalQty = const Value.absent(),
    this.totalDiscount = const Value.absent(),
    this.totalTax = const Value.absent(),
    this.grandTotal = const Value.absent(),
    this.paidAmount = const Value.absent(),
    this.saleStatus = const Value.absent(),
    this.paymentStatus = const Value.absent(),
    this.orderTaxRate = const Value.absent(),
    this.orderDiscount = const Value.absent(),
    this.shippingCost = const Value.absent(),
    this.couponId = const Value.absent(),
    this.couponActive = const Value.absent(),
    this.payloadJson = const Value.absent(),
    this.syncStatus = const Value.absent(),
    this.serverSaleId = const Value.absent(),
    this.serverReferenceNo = const Value.absent(),
    this.errorMessage = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.syncedAt = const Value.absent(),
  });
  LocalSalesCompanion.insert({
    this.id = const Value.absent(),
    required String clientUuid,
    required int warehouseId,
    required int customerId,
    this.billerId = const Value.absent(),
    this.referenceNo = const Value.absent(),
    this.itemCount = const Value.absent(),
    this.totalQty = const Value.absent(),
    this.totalDiscount = const Value.absent(),
    this.totalTax = const Value.absent(),
    required double grandTotal,
    this.paidAmount = const Value.absent(),
    this.saleStatus = const Value.absent(),
    this.paymentStatus = const Value.absent(),
    this.orderTaxRate = const Value.absent(),
    this.orderDiscount = const Value.absent(),
    this.shippingCost = const Value.absent(),
    this.couponId = const Value.absent(),
    this.couponActive = const Value.absent(),
    this.payloadJson = const Value.absent(),
    this.syncStatus = const Value.absent(),
    this.serverSaleId = const Value.absent(),
    this.serverReferenceNo = const Value.absent(),
    this.errorMessage = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.syncedAt = const Value.absent(),
  })  : clientUuid = Value(clientUuid),
        warehouseId = Value(warehouseId),
        customerId = Value(customerId),
        grandTotal = Value(grandTotal);
  static Insertable<LocalSale> custom({
    Expression<int>? id,
    Expression<String>? clientUuid,
    Expression<int>? warehouseId,
    Expression<int>? customerId,
    Expression<int>? billerId,
    Expression<String>? referenceNo,
    Expression<int>? itemCount,
    Expression<double>? totalQty,
    Expression<double>? totalDiscount,
    Expression<double>? totalTax,
    Expression<double>? grandTotal,
    Expression<double>? paidAmount,
    Expression<int>? saleStatus,
    Expression<int>? paymentStatus,
    Expression<double>? orderTaxRate,
    Expression<double>? orderDiscount,
    Expression<double>? shippingCost,
    Expression<int>? couponId,
    Expression<bool>? couponActive,
    Expression<String>? payloadJson,
    Expression<String>? syncStatus,
    Expression<int>? serverSaleId,
    Expression<String>? serverReferenceNo,
    Expression<String>? errorMessage,
    Expression<DateTime>? createdAt,
    Expression<DateTime>? syncedAt,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (clientUuid != null) 'client_uuid': clientUuid,
      if (warehouseId != null) 'warehouse_id': warehouseId,
      if (customerId != null) 'customer_id': customerId,
      if (billerId != null) 'biller_id': billerId,
      if (referenceNo != null) 'reference_no': referenceNo,
      if (itemCount != null) 'item_count': itemCount,
      if (totalQty != null) 'total_qty': totalQty,
      if (totalDiscount != null) 'total_discount': totalDiscount,
      if (totalTax != null) 'total_tax': totalTax,
      if (grandTotal != null) 'grand_total': grandTotal,
      if (paidAmount != null) 'paid_amount': paidAmount,
      if (saleStatus != null) 'sale_status': saleStatus,
      if (paymentStatus != null) 'payment_status': paymentStatus,
      if (orderTaxRate != null) 'order_tax_rate': orderTaxRate,
      if (orderDiscount != null) 'order_discount': orderDiscount,
      if (shippingCost != null) 'shipping_cost': shippingCost,
      if (couponId != null) 'coupon_id': couponId,
      if (couponActive != null) 'coupon_active': couponActive,
      if (payloadJson != null) 'payload_json': payloadJson,
      if (syncStatus != null) 'sync_status': syncStatus,
      if (serverSaleId != null) 'server_sale_id': serverSaleId,
      if (serverReferenceNo != null) 'server_reference_no': serverReferenceNo,
      if (errorMessage != null) 'error_message': errorMessage,
      if (createdAt != null) 'created_at': createdAt,
      if (syncedAt != null) 'synced_at': syncedAt,
    });
  }

  LocalSalesCompanion copyWith(
      {Value<int>? id,
      Value<String>? clientUuid,
      Value<int>? warehouseId,
      Value<int>? customerId,
      Value<int?>? billerId,
      Value<String?>? referenceNo,
      Value<int>? itemCount,
      Value<double>? totalQty,
      Value<double>? totalDiscount,
      Value<double>? totalTax,
      Value<double>? grandTotal,
      Value<double>? paidAmount,
      Value<int>? saleStatus,
      Value<int>? paymentStatus,
      Value<double>? orderTaxRate,
      Value<double>? orderDiscount,
      Value<double>? shippingCost,
      Value<int?>? couponId,
      Value<bool>? couponActive,
      Value<String?>? payloadJson,
      Value<String>? syncStatus,
      Value<int?>? serverSaleId,
      Value<String?>? serverReferenceNo,
      Value<String?>? errorMessage,
      Value<DateTime>? createdAt,
      Value<DateTime?>? syncedAt}) {
    return LocalSalesCompanion(
      id: id ?? this.id,
      clientUuid: clientUuid ?? this.clientUuid,
      warehouseId: warehouseId ?? this.warehouseId,
      customerId: customerId ?? this.customerId,
      billerId: billerId ?? this.billerId,
      referenceNo: referenceNo ?? this.referenceNo,
      itemCount: itemCount ?? this.itemCount,
      totalQty: totalQty ?? this.totalQty,
      totalDiscount: totalDiscount ?? this.totalDiscount,
      totalTax: totalTax ?? this.totalTax,
      grandTotal: grandTotal ?? this.grandTotal,
      paidAmount: paidAmount ?? this.paidAmount,
      saleStatus: saleStatus ?? this.saleStatus,
      paymentStatus: paymentStatus ?? this.paymentStatus,
      orderTaxRate: orderTaxRate ?? this.orderTaxRate,
      orderDiscount: orderDiscount ?? this.orderDiscount,
      shippingCost: shippingCost ?? this.shippingCost,
      couponId: couponId ?? this.couponId,
      couponActive: couponActive ?? this.couponActive,
      payloadJson: payloadJson ?? this.payloadJson,
      syncStatus: syncStatus ?? this.syncStatus,
      serverSaleId: serverSaleId ?? this.serverSaleId,
      serverReferenceNo: serverReferenceNo ?? this.serverReferenceNo,
      errorMessage: errorMessage ?? this.errorMessage,
      createdAt: createdAt ?? this.createdAt,
      syncedAt: syncedAt ?? this.syncedAt,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (clientUuid.present) {
      map['client_uuid'] = Variable<String>(clientUuid.value);
    }
    if (warehouseId.present) {
      map['warehouse_id'] = Variable<int>(warehouseId.value);
    }
    if (customerId.present) {
      map['customer_id'] = Variable<int>(customerId.value);
    }
    if (billerId.present) {
      map['biller_id'] = Variable<int>(billerId.value);
    }
    if (referenceNo.present) {
      map['reference_no'] = Variable<String>(referenceNo.value);
    }
    if (itemCount.present) {
      map['item_count'] = Variable<int>(itemCount.value);
    }
    if (totalQty.present) {
      map['total_qty'] = Variable<double>(totalQty.value);
    }
    if (totalDiscount.present) {
      map['total_discount'] = Variable<double>(totalDiscount.value);
    }
    if (totalTax.present) {
      map['total_tax'] = Variable<double>(totalTax.value);
    }
    if (grandTotal.present) {
      map['grand_total'] = Variable<double>(grandTotal.value);
    }
    if (paidAmount.present) {
      map['paid_amount'] = Variable<double>(paidAmount.value);
    }
    if (saleStatus.present) {
      map['sale_status'] = Variable<int>(saleStatus.value);
    }
    if (paymentStatus.present) {
      map['payment_status'] = Variable<int>(paymentStatus.value);
    }
    if (orderTaxRate.present) {
      map['order_tax_rate'] = Variable<double>(orderTaxRate.value);
    }
    if (orderDiscount.present) {
      map['order_discount'] = Variable<double>(orderDiscount.value);
    }
    if (shippingCost.present) {
      map['shipping_cost'] = Variable<double>(shippingCost.value);
    }
    if (couponId.present) {
      map['coupon_id'] = Variable<int>(couponId.value);
    }
    if (couponActive.present) {
      map['coupon_active'] = Variable<bool>(couponActive.value);
    }
    if (payloadJson.present) {
      map['payload_json'] = Variable<String>(payloadJson.value);
    }
    if (syncStatus.present) {
      map['sync_status'] = Variable<String>(syncStatus.value);
    }
    if (serverSaleId.present) {
      map['server_sale_id'] = Variable<int>(serverSaleId.value);
    }
    if (serverReferenceNo.present) {
      map['server_reference_no'] = Variable<String>(serverReferenceNo.value);
    }
    if (errorMessage.present) {
      map['error_message'] = Variable<String>(errorMessage.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (syncedAt.present) {
      map['synced_at'] = Variable<DateTime>(syncedAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalSalesCompanion(')
          ..write('id: $id, ')
          ..write('clientUuid: $clientUuid, ')
          ..write('warehouseId: $warehouseId, ')
          ..write('customerId: $customerId, ')
          ..write('billerId: $billerId, ')
          ..write('referenceNo: $referenceNo, ')
          ..write('itemCount: $itemCount, ')
          ..write('totalQty: $totalQty, ')
          ..write('totalDiscount: $totalDiscount, ')
          ..write('totalTax: $totalTax, ')
          ..write('grandTotal: $grandTotal, ')
          ..write('paidAmount: $paidAmount, ')
          ..write('saleStatus: $saleStatus, ')
          ..write('paymentStatus: $paymentStatus, ')
          ..write('orderTaxRate: $orderTaxRate, ')
          ..write('orderDiscount: $orderDiscount, ')
          ..write('shippingCost: $shippingCost, ')
          ..write('couponId: $couponId, ')
          ..write('couponActive: $couponActive, ')
          ..write('payloadJson: $payloadJson, ')
          ..write('syncStatus: $syncStatus, ')
          ..write('serverSaleId: $serverSaleId, ')
          ..write('serverReferenceNo: $serverReferenceNo, ')
          ..write('errorMessage: $errorMessage, ')
          ..write('createdAt: $createdAt, ')
          ..write('syncedAt: $syncedAt')
          ..write(')'))
        .toString();
  }
}

class $LocalSaleLinesTable extends LocalSaleLines
    with TableInfo<$LocalSaleLinesTable, LocalSaleLine> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalSaleLinesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
      'id', aliasedName, false,
      hasAutoIncrement: true,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('PRIMARY KEY AUTOINCREMENT'));
  static const VerificationMeta _localSaleIdMeta =
      const VerificationMeta('localSaleId');
  @override
  late final GeneratedColumn<int> localSaleId = GeneratedColumn<int>(
      'local_sale_id', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: true,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('REFERENCES local_sales (id)'));
  static const VerificationMeta _productIdMeta =
      const VerificationMeta('productId');
  @override
  late final GeneratedColumn<int> productId = GeneratedColumn<int>(
      'product_id', aliasedName, false,
      type: DriftSqlType.int, requiredDuringInsert: true);
  static const VerificationMeta _variantIdMeta =
      const VerificationMeta('variantId');
  @override
  late final GeneratedColumn<int> variantId = GeneratedColumn<int>(
      'variant_id', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _productBatchIdMeta =
      const VerificationMeta('productBatchId');
  @override
  late final GeneratedColumn<int> productBatchId = GeneratedColumn<int>(
      'product_batch_id', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _codeMeta = const VerificationMeta('code');
  @override
  late final GeneratedColumn<String> code = GeneratedColumn<String>(
      'code', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _nameMeta = const VerificationMeta('name');
  @override
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
      'name', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _qtyMeta = const VerificationMeta('qty');
  @override
  late final GeneratedColumn<double> qty = GeneratedColumn<double>(
      'qty', aliasedName, false,
      type: DriftSqlType.double, requiredDuringInsert: true);
  static const VerificationMeta _netUnitPriceMeta =
      const VerificationMeta('netUnitPrice');
  @override
  late final GeneratedColumn<double> netUnitPrice = GeneratedColumn<double>(
      'net_unit_price', aliasedName, false,
      type: DriftSqlType.double, requiredDuringInsert: true);
  static const VerificationMeta _discountMeta =
      const VerificationMeta('discount');
  @override
  late final GeneratedColumn<double> discount = GeneratedColumn<double>(
      'discount', aliasedName, false,
      type: DriftSqlType.double,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _taxRateMeta =
      const VerificationMeta('taxRate');
  @override
  late final GeneratedColumn<double> taxRate = GeneratedColumn<double>(
      'tax_rate', aliasedName, false,
      type: DriftSqlType.double,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _taxMeta = const VerificationMeta('tax');
  @override
  late final GeneratedColumn<double> tax = GeneratedColumn<double>(
      'tax', aliasedName, false,
      type: DriftSqlType.double,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _totalMeta = const VerificationMeta('total');
  @override
  late final GeneratedColumn<double> total = GeneratedColumn<double>(
      'total', aliasedName, false,
      type: DriftSqlType.double, requiredDuringInsert: true);
  static const VerificationMeta _saleUnitMeta =
      const VerificationMeta('saleUnit');
  @override
  late final GeneratedColumn<String> saleUnit = GeneratedColumn<String>(
      'sale_unit', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant('pc'));
  static const VerificationMeta _imeiNumberMeta =
      const VerificationMeta('imeiNumber');
  @override
  late final GeneratedColumn<String> imeiNumber = GeneratedColumn<String>(
      'imei_number', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        localSaleId,
        productId,
        variantId,
        productBatchId,
        code,
        name,
        qty,
        netUnitPrice,
        discount,
        taxRate,
        tax,
        total,
        saleUnit,
        imeiNumber
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_sale_lines';
  @override
  VerificationContext validateIntegrity(Insertable<LocalSaleLine> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('local_sale_id')) {
      context.handle(
          _localSaleIdMeta,
          localSaleId.isAcceptableOrUnknown(
              data['local_sale_id']!, _localSaleIdMeta));
    } else if (isInserting) {
      context.missing(_localSaleIdMeta);
    }
    if (data.containsKey('product_id')) {
      context.handle(_productIdMeta,
          productId.isAcceptableOrUnknown(data['product_id']!, _productIdMeta));
    } else if (isInserting) {
      context.missing(_productIdMeta);
    }
    if (data.containsKey('variant_id')) {
      context.handle(_variantIdMeta,
          variantId.isAcceptableOrUnknown(data['variant_id']!, _variantIdMeta));
    }
    if (data.containsKey('product_batch_id')) {
      context.handle(
          _productBatchIdMeta,
          productBatchId.isAcceptableOrUnknown(
              data['product_batch_id']!, _productBatchIdMeta));
    }
    if (data.containsKey('code')) {
      context.handle(
          _codeMeta, code.isAcceptableOrUnknown(data['code']!, _codeMeta));
    }
    if (data.containsKey('name')) {
      context.handle(
          _nameMeta, name.isAcceptableOrUnknown(data['name']!, _nameMeta));
    }
    if (data.containsKey('qty')) {
      context.handle(
          _qtyMeta, qty.isAcceptableOrUnknown(data['qty']!, _qtyMeta));
    } else if (isInserting) {
      context.missing(_qtyMeta);
    }
    if (data.containsKey('net_unit_price')) {
      context.handle(
          _netUnitPriceMeta,
          netUnitPrice.isAcceptableOrUnknown(
              data['net_unit_price']!, _netUnitPriceMeta));
    } else if (isInserting) {
      context.missing(_netUnitPriceMeta);
    }
    if (data.containsKey('discount')) {
      context.handle(_discountMeta,
          discount.isAcceptableOrUnknown(data['discount']!, _discountMeta));
    }
    if (data.containsKey('tax_rate')) {
      context.handle(_taxRateMeta,
          taxRate.isAcceptableOrUnknown(data['tax_rate']!, _taxRateMeta));
    }
    if (data.containsKey('tax')) {
      context.handle(
          _taxMeta, tax.isAcceptableOrUnknown(data['tax']!, _taxMeta));
    }
    if (data.containsKey('total')) {
      context.handle(
          _totalMeta, total.isAcceptableOrUnknown(data['total']!, _totalMeta));
    } else if (isInserting) {
      context.missing(_totalMeta);
    }
    if (data.containsKey('sale_unit')) {
      context.handle(_saleUnitMeta,
          saleUnit.isAcceptableOrUnknown(data['sale_unit']!, _saleUnitMeta));
    }
    if (data.containsKey('imei_number')) {
      context.handle(
          _imeiNumberMeta,
          imeiNumber.isAcceptableOrUnknown(
              data['imei_number']!, _imeiNumberMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalSaleLine map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalSaleLine(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}id'])!,
      localSaleId: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}local_sale_id'])!,
      productId: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}product_id'])!,
      variantId: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}variant_id']),
      productBatchId: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}product_batch_id']),
      code: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}code']),
      name: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}name']),
      qty: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}qty'])!,
      netUnitPrice: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}net_unit_price'])!,
      discount: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}discount'])!,
      taxRate: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}tax_rate'])!,
      tax: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}tax'])!,
      total: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}total'])!,
      saleUnit: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}sale_unit'])!,
      imeiNumber: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}imei_number']),
    );
  }

  @override
  $LocalSaleLinesTable createAlias(String alias) {
    return $LocalSaleLinesTable(attachedDatabase, alias);
  }
}

class LocalSaleLine extends DataClass implements Insertable<LocalSaleLine> {
  final int id;
  final int localSaleId;
  final int productId;
  final int? variantId;
  final int? productBatchId;
  final String? code;
  final String? name;
  final double qty;
  final double netUnitPrice;
  final double discount;
  final double taxRate;
  final double tax;
  final double total;
  final String saleUnit;
  final String? imeiNumber;
  const LocalSaleLine(
      {required this.id,
      required this.localSaleId,
      required this.productId,
      this.variantId,
      this.productBatchId,
      this.code,
      this.name,
      required this.qty,
      required this.netUnitPrice,
      required this.discount,
      required this.taxRate,
      required this.tax,
      required this.total,
      required this.saleUnit,
      this.imeiNumber});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['local_sale_id'] = Variable<int>(localSaleId);
    map['product_id'] = Variable<int>(productId);
    if (!nullToAbsent || variantId != null) {
      map['variant_id'] = Variable<int>(variantId);
    }
    if (!nullToAbsent || productBatchId != null) {
      map['product_batch_id'] = Variable<int>(productBatchId);
    }
    if (!nullToAbsent || code != null) {
      map['code'] = Variable<String>(code);
    }
    if (!nullToAbsent || name != null) {
      map['name'] = Variable<String>(name);
    }
    map['qty'] = Variable<double>(qty);
    map['net_unit_price'] = Variable<double>(netUnitPrice);
    map['discount'] = Variable<double>(discount);
    map['tax_rate'] = Variable<double>(taxRate);
    map['tax'] = Variable<double>(tax);
    map['total'] = Variable<double>(total);
    map['sale_unit'] = Variable<String>(saleUnit);
    if (!nullToAbsent || imeiNumber != null) {
      map['imei_number'] = Variable<String>(imeiNumber);
    }
    return map;
  }

  LocalSaleLinesCompanion toCompanion(bool nullToAbsent) {
    return LocalSaleLinesCompanion(
      id: Value(id),
      localSaleId: Value(localSaleId),
      productId: Value(productId),
      variantId: variantId == null && nullToAbsent
          ? const Value.absent()
          : Value(variantId),
      productBatchId: productBatchId == null && nullToAbsent
          ? const Value.absent()
          : Value(productBatchId),
      code: code == null && nullToAbsent ? const Value.absent() : Value(code),
      name: name == null && nullToAbsent ? const Value.absent() : Value(name),
      qty: Value(qty),
      netUnitPrice: Value(netUnitPrice),
      discount: Value(discount),
      taxRate: Value(taxRate),
      tax: Value(tax),
      total: Value(total),
      saleUnit: Value(saleUnit),
      imeiNumber: imeiNumber == null && nullToAbsent
          ? const Value.absent()
          : Value(imeiNumber),
    );
  }

  factory LocalSaleLine.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalSaleLine(
      id: serializer.fromJson<int>(json['id']),
      localSaleId: serializer.fromJson<int>(json['localSaleId']),
      productId: serializer.fromJson<int>(json['productId']),
      variantId: serializer.fromJson<int?>(json['variantId']),
      productBatchId: serializer.fromJson<int?>(json['productBatchId']),
      code: serializer.fromJson<String?>(json['code']),
      name: serializer.fromJson<String?>(json['name']),
      qty: serializer.fromJson<double>(json['qty']),
      netUnitPrice: serializer.fromJson<double>(json['netUnitPrice']),
      discount: serializer.fromJson<double>(json['discount']),
      taxRate: serializer.fromJson<double>(json['taxRate']),
      tax: serializer.fromJson<double>(json['tax']),
      total: serializer.fromJson<double>(json['total']),
      saleUnit: serializer.fromJson<String>(json['saleUnit']),
      imeiNumber: serializer.fromJson<String?>(json['imeiNumber']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'localSaleId': serializer.toJson<int>(localSaleId),
      'productId': serializer.toJson<int>(productId),
      'variantId': serializer.toJson<int?>(variantId),
      'productBatchId': serializer.toJson<int?>(productBatchId),
      'code': serializer.toJson<String?>(code),
      'name': serializer.toJson<String?>(name),
      'qty': serializer.toJson<double>(qty),
      'netUnitPrice': serializer.toJson<double>(netUnitPrice),
      'discount': serializer.toJson<double>(discount),
      'taxRate': serializer.toJson<double>(taxRate),
      'tax': serializer.toJson<double>(tax),
      'total': serializer.toJson<double>(total),
      'saleUnit': serializer.toJson<String>(saleUnit),
      'imeiNumber': serializer.toJson<String?>(imeiNumber),
    };
  }

  LocalSaleLine copyWith(
          {int? id,
          int? localSaleId,
          int? productId,
          Value<int?> variantId = const Value.absent(),
          Value<int?> productBatchId = const Value.absent(),
          Value<String?> code = const Value.absent(),
          Value<String?> name = const Value.absent(),
          double? qty,
          double? netUnitPrice,
          double? discount,
          double? taxRate,
          double? tax,
          double? total,
          String? saleUnit,
          Value<String?> imeiNumber = const Value.absent()}) =>
      LocalSaleLine(
        id: id ?? this.id,
        localSaleId: localSaleId ?? this.localSaleId,
        productId: productId ?? this.productId,
        variantId: variantId.present ? variantId.value : this.variantId,
        productBatchId:
            productBatchId.present ? productBatchId.value : this.productBatchId,
        code: code.present ? code.value : this.code,
        name: name.present ? name.value : this.name,
        qty: qty ?? this.qty,
        netUnitPrice: netUnitPrice ?? this.netUnitPrice,
        discount: discount ?? this.discount,
        taxRate: taxRate ?? this.taxRate,
        tax: tax ?? this.tax,
        total: total ?? this.total,
        saleUnit: saleUnit ?? this.saleUnit,
        imeiNumber: imeiNumber.present ? imeiNumber.value : this.imeiNumber,
      );
  LocalSaleLine copyWithCompanion(LocalSaleLinesCompanion data) {
    return LocalSaleLine(
      id: data.id.present ? data.id.value : this.id,
      localSaleId:
          data.localSaleId.present ? data.localSaleId.value : this.localSaleId,
      productId: data.productId.present ? data.productId.value : this.productId,
      variantId: data.variantId.present ? data.variantId.value : this.variantId,
      productBatchId: data.productBatchId.present
          ? data.productBatchId.value
          : this.productBatchId,
      code: data.code.present ? data.code.value : this.code,
      name: data.name.present ? data.name.value : this.name,
      qty: data.qty.present ? data.qty.value : this.qty,
      netUnitPrice: data.netUnitPrice.present
          ? data.netUnitPrice.value
          : this.netUnitPrice,
      discount: data.discount.present ? data.discount.value : this.discount,
      taxRate: data.taxRate.present ? data.taxRate.value : this.taxRate,
      tax: data.tax.present ? data.tax.value : this.tax,
      total: data.total.present ? data.total.value : this.total,
      saleUnit: data.saleUnit.present ? data.saleUnit.value : this.saleUnit,
      imeiNumber:
          data.imeiNumber.present ? data.imeiNumber.value : this.imeiNumber,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalSaleLine(')
          ..write('id: $id, ')
          ..write('localSaleId: $localSaleId, ')
          ..write('productId: $productId, ')
          ..write('variantId: $variantId, ')
          ..write('productBatchId: $productBatchId, ')
          ..write('code: $code, ')
          ..write('name: $name, ')
          ..write('qty: $qty, ')
          ..write('netUnitPrice: $netUnitPrice, ')
          ..write('discount: $discount, ')
          ..write('taxRate: $taxRate, ')
          ..write('tax: $tax, ')
          ..write('total: $total, ')
          ..write('saleUnit: $saleUnit, ')
          ..write('imeiNumber: $imeiNumber')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
      id,
      localSaleId,
      productId,
      variantId,
      productBatchId,
      code,
      name,
      qty,
      netUnitPrice,
      discount,
      taxRate,
      tax,
      total,
      saleUnit,
      imeiNumber);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalSaleLine &&
          other.id == this.id &&
          other.localSaleId == this.localSaleId &&
          other.productId == this.productId &&
          other.variantId == this.variantId &&
          other.productBatchId == this.productBatchId &&
          other.code == this.code &&
          other.name == this.name &&
          other.qty == this.qty &&
          other.netUnitPrice == this.netUnitPrice &&
          other.discount == this.discount &&
          other.taxRate == this.taxRate &&
          other.tax == this.tax &&
          other.total == this.total &&
          other.saleUnit == this.saleUnit &&
          other.imeiNumber == this.imeiNumber);
}

class LocalSaleLinesCompanion extends UpdateCompanion<LocalSaleLine> {
  final Value<int> id;
  final Value<int> localSaleId;
  final Value<int> productId;
  final Value<int?> variantId;
  final Value<int?> productBatchId;
  final Value<String?> code;
  final Value<String?> name;
  final Value<double> qty;
  final Value<double> netUnitPrice;
  final Value<double> discount;
  final Value<double> taxRate;
  final Value<double> tax;
  final Value<double> total;
  final Value<String> saleUnit;
  final Value<String?> imeiNumber;
  const LocalSaleLinesCompanion({
    this.id = const Value.absent(),
    this.localSaleId = const Value.absent(),
    this.productId = const Value.absent(),
    this.variantId = const Value.absent(),
    this.productBatchId = const Value.absent(),
    this.code = const Value.absent(),
    this.name = const Value.absent(),
    this.qty = const Value.absent(),
    this.netUnitPrice = const Value.absent(),
    this.discount = const Value.absent(),
    this.taxRate = const Value.absent(),
    this.tax = const Value.absent(),
    this.total = const Value.absent(),
    this.saleUnit = const Value.absent(),
    this.imeiNumber = const Value.absent(),
  });
  LocalSaleLinesCompanion.insert({
    this.id = const Value.absent(),
    required int localSaleId,
    required int productId,
    this.variantId = const Value.absent(),
    this.productBatchId = const Value.absent(),
    this.code = const Value.absent(),
    this.name = const Value.absent(),
    required double qty,
    required double netUnitPrice,
    this.discount = const Value.absent(),
    this.taxRate = const Value.absent(),
    this.tax = const Value.absent(),
    required double total,
    this.saleUnit = const Value.absent(),
    this.imeiNumber = const Value.absent(),
  })  : localSaleId = Value(localSaleId),
        productId = Value(productId),
        qty = Value(qty),
        netUnitPrice = Value(netUnitPrice),
        total = Value(total);
  static Insertable<LocalSaleLine> custom({
    Expression<int>? id,
    Expression<int>? localSaleId,
    Expression<int>? productId,
    Expression<int>? variantId,
    Expression<int>? productBatchId,
    Expression<String>? code,
    Expression<String>? name,
    Expression<double>? qty,
    Expression<double>? netUnitPrice,
    Expression<double>? discount,
    Expression<double>? taxRate,
    Expression<double>? tax,
    Expression<double>? total,
    Expression<String>? saleUnit,
    Expression<String>? imeiNumber,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (localSaleId != null) 'local_sale_id': localSaleId,
      if (productId != null) 'product_id': productId,
      if (variantId != null) 'variant_id': variantId,
      if (productBatchId != null) 'product_batch_id': productBatchId,
      if (code != null) 'code': code,
      if (name != null) 'name': name,
      if (qty != null) 'qty': qty,
      if (netUnitPrice != null) 'net_unit_price': netUnitPrice,
      if (discount != null) 'discount': discount,
      if (taxRate != null) 'tax_rate': taxRate,
      if (tax != null) 'tax': tax,
      if (total != null) 'total': total,
      if (saleUnit != null) 'sale_unit': saleUnit,
      if (imeiNumber != null) 'imei_number': imeiNumber,
    });
  }

  LocalSaleLinesCompanion copyWith(
      {Value<int>? id,
      Value<int>? localSaleId,
      Value<int>? productId,
      Value<int?>? variantId,
      Value<int?>? productBatchId,
      Value<String?>? code,
      Value<String?>? name,
      Value<double>? qty,
      Value<double>? netUnitPrice,
      Value<double>? discount,
      Value<double>? taxRate,
      Value<double>? tax,
      Value<double>? total,
      Value<String>? saleUnit,
      Value<String?>? imeiNumber}) {
    return LocalSaleLinesCompanion(
      id: id ?? this.id,
      localSaleId: localSaleId ?? this.localSaleId,
      productId: productId ?? this.productId,
      variantId: variantId ?? this.variantId,
      productBatchId: productBatchId ?? this.productBatchId,
      code: code ?? this.code,
      name: name ?? this.name,
      qty: qty ?? this.qty,
      netUnitPrice: netUnitPrice ?? this.netUnitPrice,
      discount: discount ?? this.discount,
      taxRate: taxRate ?? this.taxRate,
      tax: tax ?? this.tax,
      total: total ?? this.total,
      saleUnit: saleUnit ?? this.saleUnit,
      imeiNumber: imeiNumber ?? this.imeiNumber,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (localSaleId.present) {
      map['local_sale_id'] = Variable<int>(localSaleId.value);
    }
    if (productId.present) {
      map['product_id'] = Variable<int>(productId.value);
    }
    if (variantId.present) {
      map['variant_id'] = Variable<int>(variantId.value);
    }
    if (productBatchId.present) {
      map['product_batch_id'] = Variable<int>(productBatchId.value);
    }
    if (code.present) {
      map['code'] = Variable<String>(code.value);
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (qty.present) {
      map['qty'] = Variable<double>(qty.value);
    }
    if (netUnitPrice.present) {
      map['net_unit_price'] = Variable<double>(netUnitPrice.value);
    }
    if (discount.present) {
      map['discount'] = Variable<double>(discount.value);
    }
    if (taxRate.present) {
      map['tax_rate'] = Variable<double>(taxRate.value);
    }
    if (tax.present) {
      map['tax'] = Variable<double>(tax.value);
    }
    if (total.present) {
      map['total'] = Variable<double>(total.value);
    }
    if (saleUnit.present) {
      map['sale_unit'] = Variable<String>(saleUnit.value);
    }
    if (imeiNumber.present) {
      map['imei_number'] = Variable<String>(imeiNumber.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalSaleLinesCompanion(')
          ..write('id: $id, ')
          ..write('localSaleId: $localSaleId, ')
          ..write('productId: $productId, ')
          ..write('variantId: $variantId, ')
          ..write('productBatchId: $productBatchId, ')
          ..write('code: $code, ')
          ..write('name: $name, ')
          ..write('qty: $qty, ')
          ..write('netUnitPrice: $netUnitPrice, ')
          ..write('discount: $discount, ')
          ..write('taxRate: $taxRate, ')
          ..write('tax: $tax, ')
          ..write('total: $total, ')
          ..write('saleUnit: $saleUnit, ')
          ..write('imeiNumber: $imeiNumber')
          ..write(')'))
        .toString();
  }
}

class $LocalReturnsTable extends LocalReturns
    with TableInfo<$LocalReturnsTable, LocalReturn> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalReturnsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
      'id', aliasedName, false,
      hasAutoIncrement: true,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('PRIMARY KEY AUTOINCREMENT'));
  static const VerificationMeta _clientUuidMeta =
      const VerificationMeta('clientUuid');
  @override
  late final GeneratedColumn<String> clientUuid = GeneratedColumn<String>(
      'client_uuid', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: true,
      defaultConstraints: GeneratedColumn.constraintIsAlways('UNIQUE'));
  static const VerificationMeta _saleIdMeta = const VerificationMeta('saleId');
  @override
  late final GeneratedColumn<int> saleId = GeneratedColumn<int>(
      'sale_id', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _saleReferenceNoMeta =
      const VerificationMeta('saleReferenceNo');
  @override
  late final GeneratedColumn<String> saleReferenceNo = GeneratedColumn<String>(
      'sale_reference_no', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _warehouseIdMeta =
      const VerificationMeta('warehouseId');
  @override
  late final GeneratedColumn<int> warehouseId = GeneratedColumn<int>(
      'warehouse_id', aliasedName, false,
      type: DriftSqlType.int, requiredDuringInsert: true);
  static const VerificationMeta _customerIdMeta =
      const VerificationMeta('customerId');
  @override
  late final GeneratedColumn<int> customerId = GeneratedColumn<int>(
      'customer_id', aliasedName, false,
      type: DriftSqlType.int, requiredDuringInsert: true);
  static const VerificationMeta _referenceNoMeta =
      const VerificationMeta('referenceNo');
  @override
  late final GeneratedColumn<String> referenceNo = GeneratedColumn<String>(
      'reference_no', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _grandTotalMeta =
      const VerificationMeta('grandTotal');
  @override
  late final GeneratedColumn<double> grandTotal = GeneratedColumn<double>(
      'grand_total', aliasedName, false,
      type: DriftSqlType.double, requiredDuringInsert: true);
  static const VerificationMeta _settledAmountMeta =
      const VerificationMeta('settledAmount');
  @override
  late final GeneratedColumn<double> settledAmount = GeneratedColumn<double>(
      'settled_amount', aliasedName, false,
      type: DriftSqlType.double,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _payloadJsonMeta =
      const VerificationMeta('payloadJson');
  @override
  late final GeneratedColumn<String> payloadJson = GeneratedColumn<String>(
      'payload_json', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _syncStatusMeta =
      const VerificationMeta('syncStatus');
  @override
  late final GeneratedColumn<String> syncStatus = GeneratedColumn<String>(
      'sync_status', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant('pending'));
  static const VerificationMeta _serverReturnIdMeta =
      const VerificationMeta('serverReturnId');
  @override
  late final GeneratedColumn<int> serverReturnId = GeneratedColumn<int>(
      'server_return_id', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _serverReferenceNoMeta =
      const VerificationMeta('serverReferenceNo');
  @override
  late final GeneratedColumn<String> serverReferenceNo =
      GeneratedColumn<String>('server_reference_no', aliasedName, true,
          type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _errorMessageMeta =
      const VerificationMeta('errorMessage');
  @override
  late final GeneratedColumn<String> errorMessage = GeneratedColumn<String>(
      'error_message', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _createdAtMeta =
      const VerificationMeta('createdAt');
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
      'created_at', aliasedName, false,
      type: DriftSqlType.dateTime,
      requiredDuringInsert: false,
      defaultValue: currentDateAndTime);
  static const VerificationMeta _syncedAtMeta =
      const VerificationMeta('syncedAt');
  @override
  late final GeneratedColumn<DateTime> syncedAt = GeneratedColumn<DateTime>(
      'synced_at', aliasedName, true,
      type: DriftSqlType.dateTime, requiredDuringInsert: false);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        clientUuid,
        saleId,
        saleReferenceNo,
        warehouseId,
        customerId,
        referenceNo,
        grandTotal,
        settledAmount,
        payloadJson,
        syncStatus,
        serverReturnId,
        serverReferenceNo,
        errorMessage,
        createdAt,
        syncedAt
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_returns';
  @override
  VerificationContext validateIntegrity(Insertable<LocalReturn> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('client_uuid')) {
      context.handle(
          _clientUuidMeta,
          clientUuid.isAcceptableOrUnknown(
              data['client_uuid']!, _clientUuidMeta));
    } else if (isInserting) {
      context.missing(_clientUuidMeta);
    }
    if (data.containsKey('sale_id')) {
      context.handle(_saleIdMeta,
          saleId.isAcceptableOrUnknown(data['sale_id']!, _saleIdMeta));
    }
    if (data.containsKey('sale_reference_no')) {
      context.handle(
          _saleReferenceNoMeta,
          saleReferenceNo.isAcceptableOrUnknown(
              data['sale_reference_no']!, _saleReferenceNoMeta));
    } else if (isInserting) {
      context.missing(_saleReferenceNoMeta);
    }
    if (data.containsKey('warehouse_id')) {
      context.handle(
          _warehouseIdMeta,
          warehouseId.isAcceptableOrUnknown(
              data['warehouse_id']!, _warehouseIdMeta));
    } else if (isInserting) {
      context.missing(_warehouseIdMeta);
    }
    if (data.containsKey('customer_id')) {
      context.handle(
          _customerIdMeta,
          customerId.isAcceptableOrUnknown(
              data['customer_id']!, _customerIdMeta));
    } else if (isInserting) {
      context.missing(_customerIdMeta);
    }
    if (data.containsKey('reference_no')) {
      context.handle(
          _referenceNoMeta,
          referenceNo.isAcceptableOrUnknown(
              data['reference_no']!, _referenceNoMeta));
    }
    if (data.containsKey('grand_total')) {
      context.handle(
          _grandTotalMeta,
          grandTotal.isAcceptableOrUnknown(
              data['grand_total']!, _grandTotalMeta));
    } else if (isInserting) {
      context.missing(_grandTotalMeta);
    }
    if (data.containsKey('settled_amount')) {
      context.handle(
          _settledAmountMeta,
          settledAmount.isAcceptableOrUnknown(
              data['settled_amount']!, _settledAmountMeta));
    }
    if (data.containsKey('payload_json')) {
      context.handle(
          _payloadJsonMeta,
          payloadJson.isAcceptableOrUnknown(
              data['payload_json']!, _payloadJsonMeta));
    } else if (isInserting) {
      context.missing(_payloadJsonMeta);
    }
    if (data.containsKey('sync_status')) {
      context.handle(
          _syncStatusMeta,
          syncStatus.isAcceptableOrUnknown(
              data['sync_status']!, _syncStatusMeta));
    }
    if (data.containsKey('server_return_id')) {
      context.handle(
          _serverReturnIdMeta,
          serverReturnId.isAcceptableOrUnknown(
              data['server_return_id']!, _serverReturnIdMeta));
    }
    if (data.containsKey('server_reference_no')) {
      context.handle(
          _serverReferenceNoMeta,
          serverReferenceNo.isAcceptableOrUnknown(
              data['server_reference_no']!, _serverReferenceNoMeta));
    }
    if (data.containsKey('error_message')) {
      context.handle(
          _errorMessageMeta,
          errorMessage.isAcceptableOrUnknown(
              data['error_message']!, _errorMessageMeta));
    }
    if (data.containsKey('created_at')) {
      context.handle(_createdAtMeta,
          createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta));
    }
    if (data.containsKey('synced_at')) {
      context.handle(_syncedAtMeta,
          syncedAt.isAcceptableOrUnknown(data['synced_at']!, _syncedAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalReturn map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalReturn(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}id'])!,
      clientUuid: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}client_uuid'])!,
      saleId: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}sale_id']),
      saleReferenceNo: attachedDatabase.typeMapping.read(
          DriftSqlType.string, data['${effectivePrefix}sale_reference_no'])!,
      warehouseId: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}warehouse_id'])!,
      customerId: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}customer_id'])!,
      referenceNo: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}reference_no']),
      grandTotal: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}grand_total'])!,
      settledAmount: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}settled_amount'])!,
      payloadJson: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}payload_json'])!,
      syncStatus: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}sync_status'])!,
      serverReturnId: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}server_return_id']),
      serverReferenceNo: attachedDatabase.typeMapping.read(
          DriftSqlType.string, data['${effectivePrefix}server_reference_no']),
      errorMessage: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}error_message']),
      createdAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}created_at'])!,
      syncedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}synced_at']),
    );
  }

  @override
  $LocalReturnsTable createAlias(String alias) {
    return $LocalReturnsTable(attachedDatabase, alias);
  }
}

class LocalReturn extends DataClass implements Insertable<LocalReturn> {
  final int id;
  final String clientUuid;
  final int? saleId;
  final String saleReferenceNo;
  final int warehouseId;
  final int customerId;
  final String? referenceNo;
  final double grandTotal;
  final double settledAmount;
  final String payloadJson;
  final String syncStatus;
  final int? serverReturnId;
  final String? serverReferenceNo;
  final String? errorMessage;
  final DateTime createdAt;
  final DateTime? syncedAt;
  const LocalReturn(
      {required this.id,
      required this.clientUuid,
      this.saleId,
      required this.saleReferenceNo,
      required this.warehouseId,
      required this.customerId,
      this.referenceNo,
      required this.grandTotal,
      required this.settledAmount,
      required this.payloadJson,
      required this.syncStatus,
      this.serverReturnId,
      this.serverReferenceNo,
      this.errorMessage,
      required this.createdAt,
      this.syncedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['client_uuid'] = Variable<String>(clientUuid);
    if (!nullToAbsent || saleId != null) {
      map['sale_id'] = Variable<int>(saleId);
    }
    map['sale_reference_no'] = Variable<String>(saleReferenceNo);
    map['warehouse_id'] = Variable<int>(warehouseId);
    map['customer_id'] = Variable<int>(customerId);
    if (!nullToAbsent || referenceNo != null) {
      map['reference_no'] = Variable<String>(referenceNo);
    }
    map['grand_total'] = Variable<double>(grandTotal);
    map['settled_amount'] = Variable<double>(settledAmount);
    map['payload_json'] = Variable<String>(payloadJson);
    map['sync_status'] = Variable<String>(syncStatus);
    if (!nullToAbsent || serverReturnId != null) {
      map['server_return_id'] = Variable<int>(serverReturnId);
    }
    if (!nullToAbsent || serverReferenceNo != null) {
      map['server_reference_no'] = Variable<String>(serverReferenceNo);
    }
    if (!nullToAbsent || errorMessage != null) {
      map['error_message'] = Variable<String>(errorMessage);
    }
    map['created_at'] = Variable<DateTime>(createdAt);
    if (!nullToAbsent || syncedAt != null) {
      map['synced_at'] = Variable<DateTime>(syncedAt);
    }
    return map;
  }

  LocalReturnsCompanion toCompanion(bool nullToAbsent) {
    return LocalReturnsCompanion(
      id: Value(id),
      clientUuid: Value(clientUuid),
      saleId:
          saleId == null && nullToAbsent ? const Value.absent() : Value(saleId),
      saleReferenceNo: Value(saleReferenceNo),
      warehouseId: Value(warehouseId),
      customerId: Value(customerId),
      referenceNo: referenceNo == null && nullToAbsent
          ? const Value.absent()
          : Value(referenceNo),
      grandTotal: Value(grandTotal),
      settledAmount: Value(settledAmount),
      payloadJson: Value(payloadJson),
      syncStatus: Value(syncStatus),
      serverReturnId: serverReturnId == null && nullToAbsent
          ? const Value.absent()
          : Value(serverReturnId),
      serverReferenceNo: serverReferenceNo == null && nullToAbsent
          ? const Value.absent()
          : Value(serverReferenceNo),
      errorMessage: errorMessage == null && nullToAbsent
          ? const Value.absent()
          : Value(errorMessage),
      createdAt: Value(createdAt),
      syncedAt: syncedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(syncedAt),
    );
  }

  factory LocalReturn.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalReturn(
      id: serializer.fromJson<int>(json['id']),
      clientUuid: serializer.fromJson<String>(json['clientUuid']),
      saleId: serializer.fromJson<int?>(json['saleId']),
      saleReferenceNo: serializer.fromJson<String>(json['saleReferenceNo']),
      warehouseId: serializer.fromJson<int>(json['warehouseId']),
      customerId: serializer.fromJson<int>(json['customerId']),
      referenceNo: serializer.fromJson<String?>(json['referenceNo']),
      grandTotal: serializer.fromJson<double>(json['grandTotal']),
      settledAmount: serializer.fromJson<double>(json['settledAmount']),
      payloadJson: serializer.fromJson<String>(json['payloadJson']),
      syncStatus: serializer.fromJson<String>(json['syncStatus']),
      serverReturnId: serializer.fromJson<int?>(json['serverReturnId']),
      serverReferenceNo:
          serializer.fromJson<String?>(json['serverReferenceNo']),
      errorMessage: serializer.fromJson<String?>(json['errorMessage']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      syncedAt: serializer.fromJson<DateTime?>(json['syncedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'clientUuid': serializer.toJson<String>(clientUuid),
      'saleId': serializer.toJson<int?>(saleId),
      'saleReferenceNo': serializer.toJson<String>(saleReferenceNo),
      'warehouseId': serializer.toJson<int>(warehouseId),
      'customerId': serializer.toJson<int>(customerId),
      'referenceNo': serializer.toJson<String?>(referenceNo),
      'grandTotal': serializer.toJson<double>(grandTotal),
      'settledAmount': serializer.toJson<double>(settledAmount),
      'payloadJson': serializer.toJson<String>(payloadJson),
      'syncStatus': serializer.toJson<String>(syncStatus),
      'serverReturnId': serializer.toJson<int?>(serverReturnId),
      'serverReferenceNo': serializer.toJson<String?>(serverReferenceNo),
      'errorMessage': serializer.toJson<String?>(errorMessage),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'syncedAt': serializer.toJson<DateTime?>(syncedAt),
    };
  }

  LocalReturn copyWith(
          {int? id,
          String? clientUuid,
          Value<int?> saleId = const Value.absent(),
          String? saleReferenceNo,
          int? warehouseId,
          int? customerId,
          Value<String?> referenceNo = const Value.absent(),
          double? grandTotal,
          double? settledAmount,
          String? payloadJson,
          String? syncStatus,
          Value<int?> serverReturnId = const Value.absent(),
          Value<String?> serverReferenceNo = const Value.absent(),
          Value<String?> errorMessage = const Value.absent(),
          DateTime? createdAt,
          Value<DateTime?> syncedAt = const Value.absent()}) =>
      LocalReturn(
        id: id ?? this.id,
        clientUuid: clientUuid ?? this.clientUuid,
        saleId: saleId.present ? saleId.value : this.saleId,
        saleReferenceNo: saleReferenceNo ?? this.saleReferenceNo,
        warehouseId: warehouseId ?? this.warehouseId,
        customerId: customerId ?? this.customerId,
        referenceNo: referenceNo.present ? referenceNo.value : this.referenceNo,
        grandTotal: grandTotal ?? this.grandTotal,
        settledAmount: settledAmount ?? this.settledAmount,
        payloadJson: payloadJson ?? this.payloadJson,
        syncStatus: syncStatus ?? this.syncStatus,
        serverReturnId:
            serverReturnId.present ? serverReturnId.value : this.serverReturnId,
        serverReferenceNo: serverReferenceNo.present
            ? serverReferenceNo.value
            : this.serverReferenceNo,
        errorMessage:
            errorMessage.present ? errorMessage.value : this.errorMessage,
        createdAt: createdAt ?? this.createdAt,
        syncedAt: syncedAt.present ? syncedAt.value : this.syncedAt,
      );
  LocalReturn copyWithCompanion(LocalReturnsCompanion data) {
    return LocalReturn(
      id: data.id.present ? data.id.value : this.id,
      clientUuid:
          data.clientUuid.present ? data.clientUuid.value : this.clientUuid,
      saleId: data.saleId.present ? data.saleId.value : this.saleId,
      saleReferenceNo: data.saleReferenceNo.present
          ? data.saleReferenceNo.value
          : this.saleReferenceNo,
      warehouseId:
          data.warehouseId.present ? data.warehouseId.value : this.warehouseId,
      customerId:
          data.customerId.present ? data.customerId.value : this.customerId,
      referenceNo:
          data.referenceNo.present ? data.referenceNo.value : this.referenceNo,
      grandTotal:
          data.grandTotal.present ? data.grandTotal.value : this.grandTotal,
      settledAmount: data.settledAmount.present
          ? data.settledAmount.value
          : this.settledAmount,
      payloadJson:
          data.payloadJson.present ? data.payloadJson.value : this.payloadJson,
      syncStatus:
          data.syncStatus.present ? data.syncStatus.value : this.syncStatus,
      serverReturnId: data.serverReturnId.present
          ? data.serverReturnId.value
          : this.serverReturnId,
      serverReferenceNo: data.serverReferenceNo.present
          ? data.serverReferenceNo.value
          : this.serverReferenceNo,
      errorMessage: data.errorMessage.present
          ? data.errorMessage.value
          : this.errorMessage,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      syncedAt: data.syncedAt.present ? data.syncedAt.value : this.syncedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalReturn(')
          ..write('id: $id, ')
          ..write('clientUuid: $clientUuid, ')
          ..write('saleId: $saleId, ')
          ..write('saleReferenceNo: $saleReferenceNo, ')
          ..write('warehouseId: $warehouseId, ')
          ..write('customerId: $customerId, ')
          ..write('referenceNo: $referenceNo, ')
          ..write('grandTotal: $grandTotal, ')
          ..write('settledAmount: $settledAmount, ')
          ..write('payloadJson: $payloadJson, ')
          ..write('syncStatus: $syncStatus, ')
          ..write('serverReturnId: $serverReturnId, ')
          ..write('serverReferenceNo: $serverReferenceNo, ')
          ..write('errorMessage: $errorMessage, ')
          ..write('createdAt: $createdAt, ')
          ..write('syncedAt: $syncedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
      id,
      clientUuid,
      saleId,
      saleReferenceNo,
      warehouseId,
      customerId,
      referenceNo,
      grandTotal,
      settledAmount,
      payloadJson,
      syncStatus,
      serverReturnId,
      serverReferenceNo,
      errorMessage,
      createdAt,
      syncedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalReturn &&
          other.id == this.id &&
          other.clientUuid == this.clientUuid &&
          other.saleId == this.saleId &&
          other.saleReferenceNo == this.saleReferenceNo &&
          other.warehouseId == this.warehouseId &&
          other.customerId == this.customerId &&
          other.referenceNo == this.referenceNo &&
          other.grandTotal == this.grandTotal &&
          other.settledAmount == this.settledAmount &&
          other.payloadJson == this.payloadJson &&
          other.syncStatus == this.syncStatus &&
          other.serverReturnId == this.serverReturnId &&
          other.serverReferenceNo == this.serverReferenceNo &&
          other.errorMessage == this.errorMessage &&
          other.createdAt == this.createdAt &&
          other.syncedAt == this.syncedAt);
}

class LocalReturnsCompanion extends UpdateCompanion<LocalReturn> {
  final Value<int> id;
  final Value<String> clientUuid;
  final Value<int?> saleId;
  final Value<String> saleReferenceNo;
  final Value<int> warehouseId;
  final Value<int> customerId;
  final Value<String?> referenceNo;
  final Value<double> grandTotal;
  final Value<double> settledAmount;
  final Value<String> payloadJson;
  final Value<String> syncStatus;
  final Value<int?> serverReturnId;
  final Value<String?> serverReferenceNo;
  final Value<String?> errorMessage;
  final Value<DateTime> createdAt;
  final Value<DateTime?> syncedAt;
  const LocalReturnsCompanion({
    this.id = const Value.absent(),
    this.clientUuid = const Value.absent(),
    this.saleId = const Value.absent(),
    this.saleReferenceNo = const Value.absent(),
    this.warehouseId = const Value.absent(),
    this.customerId = const Value.absent(),
    this.referenceNo = const Value.absent(),
    this.grandTotal = const Value.absent(),
    this.settledAmount = const Value.absent(),
    this.payloadJson = const Value.absent(),
    this.syncStatus = const Value.absent(),
    this.serverReturnId = const Value.absent(),
    this.serverReferenceNo = const Value.absent(),
    this.errorMessage = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.syncedAt = const Value.absent(),
  });
  LocalReturnsCompanion.insert({
    this.id = const Value.absent(),
    required String clientUuid,
    this.saleId = const Value.absent(),
    required String saleReferenceNo,
    required int warehouseId,
    required int customerId,
    this.referenceNo = const Value.absent(),
    required double grandTotal,
    this.settledAmount = const Value.absent(),
    required String payloadJson,
    this.syncStatus = const Value.absent(),
    this.serverReturnId = const Value.absent(),
    this.serverReferenceNo = const Value.absent(),
    this.errorMessage = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.syncedAt = const Value.absent(),
  })  : clientUuid = Value(clientUuid),
        saleReferenceNo = Value(saleReferenceNo),
        warehouseId = Value(warehouseId),
        customerId = Value(customerId),
        grandTotal = Value(grandTotal),
        payloadJson = Value(payloadJson);
  static Insertable<LocalReturn> custom({
    Expression<int>? id,
    Expression<String>? clientUuid,
    Expression<int>? saleId,
    Expression<String>? saleReferenceNo,
    Expression<int>? warehouseId,
    Expression<int>? customerId,
    Expression<String>? referenceNo,
    Expression<double>? grandTotal,
    Expression<double>? settledAmount,
    Expression<String>? payloadJson,
    Expression<String>? syncStatus,
    Expression<int>? serverReturnId,
    Expression<String>? serverReferenceNo,
    Expression<String>? errorMessage,
    Expression<DateTime>? createdAt,
    Expression<DateTime>? syncedAt,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (clientUuid != null) 'client_uuid': clientUuid,
      if (saleId != null) 'sale_id': saleId,
      if (saleReferenceNo != null) 'sale_reference_no': saleReferenceNo,
      if (warehouseId != null) 'warehouse_id': warehouseId,
      if (customerId != null) 'customer_id': customerId,
      if (referenceNo != null) 'reference_no': referenceNo,
      if (grandTotal != null) 'grand_total': grandTotal,
      if (settledAmount != null) 'settled_amount': settledAmount,
      if (payloadJson != null) 'payload_json': payloadJson,
      if (syncStatus != null) 'sync_status': syncStatus,
      if (serverReturnId != null) 'server_return_id': serverReturnId,
      if (serverReferenceNo != null) 'server_reference_no': serverReferenceNo,
      if (errorMessage != null) 'error_message': errorMessage,
      if (createdAt != null) 'created_at': createdAt,
      if (syncedAt != null) 'synced_at': syncedAt,
    });
  }

  LocalReturnsCompanion copyWith(
      {Value<int>? id,
      Value<String>? clientUuid,
      Value<int?>? saleId,
      Value<String>? saleReferenceNo,
      Value<int>? warehouseId,
      Value<int>? customerId,
      Value<String?>? referenceNo,
      Value<double>? grandTotal,
      Value<double>? settledAmount,
      Value<String>? payloadJson,
      Value<String>? syncStatus,
      Value<int?>? serverReturnId,
      Value<String?>? serverReferenceNo,
      Value<String?>? errorMessage,
      Value<DateTime>? createdAt,
      Value<DateTime?>? syncedAt}) {
    return LocalReturnsCompanion(
      id: id ?? this.id,
      clientUuid: clientUuid ?? this.clientUuid,
      saleId: saleId ?? this.saleId,
      saleReferenceNo: saleReferenceNo ?? this.saleReferenceNo,
      warehouseId: warehouseId ?? this.warehouseId,
      customerId: customerId ?? this.customerId,
      referenceNo: referenceNo ?? this.referenceNo,
      grandTotal: grandTotal ?? this.grandTotal,
      settledAmount: settledAmount ?? this.settledAmount,
      payloadJson: payloadJson ?? this.payloadJson,
      syncStatus: syncStatus ?? this.syncStatus,
      serverReturnId: serverReturnId ?? this.serverReturnId,
      serverReferenceNo: serverReferenceNo ?? this.serverReferenceNo,
      errorMessage: errorMessage ?? this.errorMessage,
      createdAt: createdAt ?? this.createdAt,
      syncedAt: syncedAt ?? this.syncedAt,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (clientUuid.present) {
      map['client_uuid'] = Variable<String>(clientUuid.value);
    }
    if (saleId.present) {
      map['sale_id'] = Variable<int>(saleId.value);
    }
    if (saleReferenceNo.present) {
      map['sale_reference_no'] = Variable<String>(saleReferenceNo.value);
    }
    if (warehouseId.present) {
      map['warehouse_id'] = Variable<int>(warehouseId.value);
    }
    if (customerId.present) {
      map['customer_id'] = Variable<int>(customerId.value);
    }
    if (referenceNo.present) {
      map['reference_no'] = Variable<String>(referenceNo.value);
    }
    if (grandTotal.present) {
      map['grand_total'] = Variable<double>(grandTotal.value);
    }
    if (settledAmount.present) {
      map['settled_amount'] = Variable<double>(settledAmount.value);
    }
    if (payloadJson.present) {
      map['payload_json'] = Variable<String>(payloadJson.value);
    }
    if (syncStatus.present) {
      map['sync_status'] = Variable<String>(syncStatus.value);
    }
    if (serverReturnId.present) {
      map['server_return_id'] = Variable<int>(serverReturnId.value);
    }
    if (serverReferenceNo.present) {
      map['server_reference_no'] = Variable<String>(serverReferenceNo.value);
    }
    if (errorMessage.present) {
      map['error_message'] = Variable<String>(errorMessage.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (syncedAt.present) {
      map['synced_at'] = Variable<DateTime>(syncedAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalReturnsCompanion(')
          ..write('id: $id, ')
          ..write('clientUuid: $clientUuid, ')
          ..write('saleId: $saleId, ')
          ..write('saleReferenceNo: $saleReferenceNo, ')
          ..write('warehouseId: $warehouseId, ')
          ..write('customerId: $customerId, ')
          ..write('referenceNo: $referenceNo, ')
          ..write('grandTotal: $grandTotal, ')
          ..write('settledAmount: $settledAmount, ')
          ..write('payloadJson: $payloadJson, ')
          ..write('syncStatus: $syncStatus, ')
          ..write('serverReturnId: $serverReturnId, ')
          ..write('serverReferenceNo: $serverReferenceNo, ')
          ..write('errorMessage: $errorMessage, ')
          ..write('createdAt: $createdAt, ')
          ..write('syncedAt: $syncedAt')
          ..write(')'))
        .toString();
  }
}

class $LocalExchangesTable extends LocalExchanges
    with TableInfo<$LocalExchangesTable, LocalExchange> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalExchangesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
      'id', aliasedName, false,
      hasAutoIncrement: true,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('PRIMARY KEY AUTOINCREMENT'));
  static const VerificationMeta _clientUuidMeta =
      const VerificationMeta('clientUuid');
  @override
  late final GeneratedColumn<String> clientUuid = GeneratedColumn<String>(
      'client_uuid', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: true,
      defaultConstraints: GeneratedColumn.constraintIsAlways('UNIQUE'));
  static const VerificationMeta _saleIdMeta = const VerificationMeta('saleId');
  @override
  late final GeneratedColumn<int> saleId = GeneratedColumn<int>(
      'sale_id', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _saleReferenceNoMeta =
      const VerificationMeta('saleReferenceNo');
  @override
  late final GeneratedColumn<String> saleReferenceNo = GeneratedColumn<String>(
      'sale_reference_no', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _warehouseIdMeta =
      const VerificationMeta('warehouseId');
  @override
  late final GeneratedColumn<int> warehouseId = GeneratedColumn<int>(
      'warehouse_id', aliasedName, false,
      type: DriftSqlType.int, requiredDuringInsert: true);
  static const VerificationMeta _customerIdMeta =
      const VerificationMeta('customerId');
  @override
  late final GeneratedColumn<int> customerId = GeneratedColumn<int>(
      'customer_id', aliasedName, false,
      type: DriftSqlType.int, requiredDuringInsert: true);
  static const VerificationMeta _referenceNoMeta =
      const VerificationMeta('referenceNo');
  @override
  late final GeneratedColumn<String> referenceNo = GeneratedColumn<String>(
      'reference_no', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _balanceMeta =
      const VerificationMeta('balance');
  @override
  late final GeneratedColumn<double> balance = GeneratedColumn<double>(
      'balance', aliasedName, false,
      type: DriftSqlType.double, requiredDuringInsert: true);
  static const VerificationMeta _paymentTypeMeta =
      const VerificationMeta('paymentType');
  @override
  late final GeneratedColumn<String> paymentType = GeneratedColumn<String>(
      'payment_type', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _payloadJsonMeta =
      const VerificationMeta('payloadJson');
  @override
  late final GeneratedColumn<String> payloadJson = GeneratedColumn<String>(
      'payload_json', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _syncStatusMeta =
      const VerificationMeta('syncStatus');
  @override
  late final GeneratedColumn<String> syncStatus = GeneratedColumn<String>(
      'sync_status', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant('pending'));
  static const VerificationMeta _serverExchangeIdMeta =
      const VerificationMeta('serverExchangeId');
  @override
  late final GeneratedColumn<int> serverExchangeId = GeneratedColumn<int>(
      'server_exchange_id', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _serverReferenceNoMeta =
      const VerificationMeta('serverReferenceNo');
  @override
  late final GeneratedColumn<String> serverReferenceNo =
      GeneratedColumn<String>('server_reference_no', aliasedName, true,
          type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _errorMessageMeta =
      const VerificationMeta('errorMessage');
  @override
  late final GeneratedColumn<String> errorMessage = GeneratedColumn<String>(
      'error_message', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _createdAtMeta =
      const VerificationMeta('createdAt');
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
      'created_at', aliasedName, false,
      type: DriftSqlType.dateTime,
      requiredDuringInsert: false,
      defaultValue: currentDateAndTime);
  static const VerificationMeta _syncedAtMeta =
      const VerificationMeta('syncedAt');
  @override
  late final GeneratedColumn<DateTime> syncedAt = GeneratedColumn<DateTime>(
      'synced_at', aliasedName, true,
      type: DriftSqlType.dateTime, requiredDuringInsert: false);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        clientUuid,
        saleId,
        saleReferenceNo,
        warehouseId,
        customerId,
        referenceNo,
        balance,
        paymentType,
        payloadJson,
        syncStatus,
        serverExchangeId,
        serverReferenceNo,
        errorMessage,
        createdAt,
        syncedAt
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_exchanges';
  @override
  VerificationContext validateIntegrity(Insertable<LocalExchange> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('client_uuid')) {
      context.handle(
          _clientUuidMeta,
          clientUuid.isAcceptableOrUnknown(
              data['client_uuid']!, _clientUuidMeta));
    } else if (isInserting) {
      context.missing(_clientUuidMeta);
    }
    if (data.containsKey('sale_id')) {
      context.handle(_saleIdMeta,
          saleId.isAcceptableOrUnknown(data['sale_id']!, _saleIdMeta));
    }
    if (data.containsKey('sale_reference_no')) {
      context.handle(
          _saleReferenceNoMeta,
          saleReferenceNo.isAcceptableOrUnknown(
              data['sale_reference_no']!, _saleReferenceNoMeta));
    } else if (isInserting) {
      context.missing(_saleReferenceNoMeta);
    }
    if (data.containsKey('warehouse_id')) {
      context.handle(
          _warehouseIdMeta,
          warehouseId.isAcceptableOrUnknown(
              data['warehouse_id']!, _warehouseIdMeta));
    } else if (isInserting) {
      context.missing(_warehouseIdMeta);
    }
    if (data.containsKey('customer_id')) {
      context.handle(
          _customerIdMeta,
          customerId.isAcceptableOrUnknown(
              data['customer_id']!, _customerIdMeta));
    } else if (isInserting) {
      context.missing(_customerIdMeta);
    }
    if (data.containsKey('reference_no')) {
      context.handle(
          _referenceNoMeta,
          referenceNo.isAcceptableOrUnknown(
              data['reference_no']!, _referenceNoMeta));
    }
    if (data.containsKey('balance')) {
      context.handle(_balanceMeta,
          balance.isAcceptableOrUnknown(data['balance']!, _balanceMeta));
    } else if (isInserting) {
      context.missing(_balanceMeta);
    }
    if (data.containsKey('payment_type')) {
      context.handle(
          _paymentTypeMeta,
          paymentType.isAcceptableOrUnknown(
              data['payment_type']!, _paymentTypeMeta));
    }
    if (data.containsKey('payload_json')) {
      context.handle(
          _payloadJsonMeta,
          payloadJson.isAcceptableOrUnknown(
              data['payload_json']!, _payloadJsonMeta));
    } else if (isInserting) {
      context.missing(_payloadJsonMeta);
    }
    if (data.containsKey('sync_status')) {
      context.handle(
          _syncStatusMeta,
          syncStatus.isAcceptableOrUnknown(
              data['sync_status']!, _syncStatusMeta));
    }
    if (data.containsKey('server_exchange_id')) {
      context.handle(
          _serverExchangeIdMeta,
          serverExchangeId.isAcceptableOrUnknown(
              data['server_exchange_id']!, _serverExchangeIdMeta));
    }
    if (data.containsKey('server_reference_no')) {
      context.handle(
          _serverReferenceNoMeta,
          serverReferenceNo.isAcceptableOrUnknown(
              data['server_reference_no']!, _serverReferenceNoMeta));
    }
    if (data.containsKey('error_message')) {
      context.handle(
          _errorMessageMeta,
          errorMessage.isAcceptableOrUnknown(
              data['error_message']!, _errorMessageMeta));
    }
    if (data.containsKey('created_at')) {
      context.handle(_createdAtMeta,
          createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta));
    }
    if (data.containsKey('synced_at')) {
      context.handle(_syncedAtMeta,
          syncedAt.isAcceptableOrUnknown(data['synced_at']!, _syncedAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalExchange map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalExchange(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}id'])!,
      clientUuid: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}client_uuid'])!,
      saleId: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}sale_id']),
      saleReferenceNo: attachedDatabase.typeMapping.read(
          DriftSqlType.string, data['${effectivePrefix}sale_reference_no'])!,
      warehouseId: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}warehouse_id'])!,
      customerId: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}customer_id'])!,
      referenceNo: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}reference_no']),
      balance: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}balance'])!,
      paymentType: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}payment_type']),
      payloadJson: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}payload_json'])!,
      syncStatus: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}sync_status'])!,
      serverExchangeId: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}server_exchange_id']),
      serverReferenceNo: attachedDatabase.typeMapping.read(
          DriftSqlType.string, data['${effectivePrefix}server_reference_no']),
      errorMessage: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}error_message']),
      createdAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}created_at'])!,
      syncedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}synced_at']),
    );
  }

  @override
  $LocalExchangesTable createAlias(String alias) {
    return $LocalExchangesTable(attachedDatabase, alias);
  }
}

class LocalExchange extends DataClass implements Insertable<LocalExchange> {
  final int id;
  final String clientUuid;
  final int? saleId;
  final String saleReferenceNo;
  final int warehouseId;
  final int customerId;
  final String? referenceNo;
  final double balance;
  final String? paymentType;
  final String payloadJson;
  final String syncStatus;
  final int? serverExchangeId;
  final String? serverReferenceNo;
  final String? errorMessage;
  final DateTime createdAt;
  final DateTime? syncedAt;
  const LocalExchange(
      {required this.id,
      required this.clientUuid,
      this.saleId,
      required this.saleReferenceNo,
      required this.warehouseId,
      required this.customerId,
      this.referenceNo,
      required this.balance,
      this.paymentType,
      required this.payloadJson,
      required this.syncStatus,
      this.serverExchangeId,
      this.serverReferenceNo,
      this.errorMessage,
      required this.createdAt,
      this.syncedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['client_uuid'] = Variable<String>(clientUuid);
    if (!nullToAbsent || saleId != null) {
      map['sale_id'] = Variable<int>(saleId);
    }
    map['sale_reference_no'] = Variable<String>(saleReferenceNo);
    map['warehouse_id'] = Variable<int>(warehouseId);
    map['customer_id'] = Variable<int>(customerId);
    if (!nullToAbsent || referenceNo != null) {
      map['reference_no'] = Variable<String>(referenceNo);
    }
    map['balance'] = Variable<double>(balance);
    if (!nullToAbsent || paymentType != null) {
      map['payment_type'] = Variable<String>(paymentType);
    }
    map['payload_json'] = Variable<String>(payloadJson);
    map['sync_status'] = Variable<String>(syncStatus);
    if (!nullToAbsent || serverExchangeId != null) {
      map['server_exchange_id'] = Variable<int>(serverExchangeId);
    }
    if (!nullToAbsent || serverReferenceNo != null) {
      map['server_reference_no'] = Variable<String>(serverReferenceNo);
    }
    if (!nullToAbsent || errorMessage != null) {
      map['error_message'] = Variable<String>(errorMessage);
    }
    map['created_at'] = Variable<DateTime>(createdAt);
    if (!nullToAbsent || syncedAt != null) {
      map['synced_at'] = Variable<DateTime>(syncedAt);
    }
    return map;
  }

  LocalExchangesCompanion toCompanion(bool nullToAbsent) {
    return LocalExchangesCompanion(
      id: Value(id),
      clientUuid: Value(clientUuid),
      saleId:
          saleId == null && nullToAbsent ? const Value.absent() : Value(saleId),
      saleReferenceNo: Value(saleReferenceNo),
      warehouseId: Value(warehouseId),
      customerId: Value(customerId),
      referenceNo: referenceNo == null && nullToAbsent
          ? const Value.absent()
          : Value(referenceNo),
      balance: Value(balance),
      paymentType: paymentType == null && nullToAbsent
          ? const Value.absent()
          : Value(paymentType),
      payloadJson: Value(payloadJson),
      syncStatus: Value(syncStatus),
      serverExchangeId: serverExchangeId == null && nullToAbsent
          ? const Value.absent()
          : Value(serverExchangeId),
      serverReferenceNo: serverReferenceNo == null && nullToAbsent
          ? const Value.absent()
          : Value(serverReferenceNo),
      errorMessage: errorMessage == null && nullToAbsent
          ? const Value.absent()
          : Value(errorMessage),
      createdAt: Value(createdAt),
      syncedAt: syncedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(syncedAt),
    );
  }

  factory LocalExchange.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalExchange(
      id: serializer.fromJson<int>(json['id']),
      clientUuid: serializer.fromJson<String>(json['clientUuid']),
      saleId: serializer.fromJson<int?>(json['saleId']),
      saleReferenceNo: serializer.fromJson<String>(json['saleReferenceNo']),
      warehouseId: serializer.fromJson<int>(json['warehouseId']),
      customerId: serializer.fromJson<int>(json['customerId']),
      referenceNo: serializer.fromJson<String?>(json['referenceNo']),
      balance: serializer.fromJson<double>(json['balance']),
      paymentType: serializer.fromJson<String?>(json['paymentType']),
      payloadJson: serializer.fromJson<String>(json['payloadJson']),
      syncStatus: serializer.fromJson<String>(json['syncStatus']),
      serverExchangeId: serializer.fromJson<int?>(json['serverExchangeId']),
      serverReferenceNo:
          serializer.fromJson<String?>(json['serverReferenceNo']),
      errorMessage: serializer.fromJson<String?>(json['errorMessage']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      syncedAt: serializer.fromJson<DateTime?>(json['syncedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'clientUuid': serializer.toJson<String>(clientUuid),
      'saleId': serializer.toJson<int?>(saleId),
      'saleReferenceNo': serializer.toJson<String>(saleReferenceNo),
      'warehouseId': serializer.toJson<int>(warehouseId),
      'customerId': serializer.toJson<int>(customerId),
      'referenceNo': serializer.toJson<String?>(referenceNo),
      'balance': serializer.toJson<double>(balance),
      'paymentType': serializer.toJson<String?>(paymentType),
      'payloadJson': serializer.toJson<String>(payloadJson),
      'syncStatus': serializer.toJson<String>(syncStatus),
      'serverExchangeId': serializer.toJson<int?>(serverExchangeId),
      'serverReferenceNo': serializer.toJson<String?>(serverReferenceNo),
      'errorMessage': serializer.toJson<String?>(errorMessage),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'syncedAt': serializer.toJson<DateTime?>(syncedAt),
    };
  }

  LocalExchange copyWith(
          {int? id,
          String? clientUuid,
          Value<int?> saleId = const Value.absent(),
          String? saleReferenceNo,
          int? warehouseId,
          int? customerId,
          Value<String?> referenceNo = const Value.absent(),
          double? balance,
          Value<String?> paymentType = const Value.absent(),
          String? payloadJson,
          String? syncStatus,
          Value<int?> serverExchangeId = const Value.absent(),
          Value<String?> serverReferenceNo = const Value.absent(),
          Value<String?> errorMessage = const Value.absent(),
          DateTime? createdAt,
          Value<DateTime?> syncedAt = const Value.absent()}) =>
      LocalExchange(
        id: id ?? this.id,
        clientUuid: clientUuid ?? this.clientUuid,
        saleId: saleId.present ? saleId.value : this.saleId,
        saleReferenceNo: saleReferenceNo ?? this.saleReferenceNo,
        warehouseId: warehouseId ?? this.warehouseId,
        customerId: customerId ?? this.customerId,
        referenceNo: referenceNo.present ? referenceNo.value : this.referenceNo,
        balance: balance ?? this.balance,
        paymentType: paymentType.present ? paymentType.value : this.paymentType,
        payloadJson: payloadJson ?? this.payloadJson,
        syncStatus: syncStatus ?? this.syncStatus,
        serverExchangeId: serverExchangeId.present
            ? serverExchangeId.value
            : this.serverExchangeId,
        serverReferenceNo: serverReferenceNo.present
            ? serverReferenceNo.value
            : this.serverReferenceNo,
        errorMessage:
            errorMessage.present ? errorMessage.value : this.errorMessage,
        createdAt: createdAt ?? this.createdAt,
        syncedAt: syncedAt.present ? syncedAt.value : this.syncedAt,
      );
  LocalExchange copyWithCompanion(LocalExchangesCompanion data) {
    return LocalExchange(
      id: data.id.present ? data.id.value : this.id,
      clientUuid:
          data.clientUuid.present ? data.clientUuid.value : this.clientUuid,
      saleId: data.saleId.present ? data.saleId.value : this.saleId,
      saleReferenceNo: data.saleReferenceNo.present
          ? data.saleReferenceNo.value
          : this.saleReferenceNo,
      warehouseId:
          data.warehouseId.present ? data.warehouseId.value : this.warehouseId,
      customerId:
          data.customerId.present ? data.customerId.value : this.customerId,
      referenceNo:
          data.referenceNo.present ? data.referenceNo.value : this.referenceNo,
      balance: data.balance.present ? data.balance.value : this.balance,
      paymentType:
          data.paymentType.present ? data.paymentType.value : this.paymentType,
      payloadJson:
          data.payloadJson.present ? data.payloadJson.value : this.payloadJson,
      syncStatus:
          data.syncStatus.present ? data.syncStatus.value : this.syncStatus,
      serverExchangeId: data.serverExchangeId.present
          ? data.serverExchangeId.value
          : this.serverExchangeId,
      serverReferenceNo: data.serverReferenceNo.present
          ? data.serverReferenceNo.value
          : this.serverReferenceNo,
      errorMessage: data.errorMessage.present
          ? data.errorMessage.value
          : this.errorMessage,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      syncedAt: data.syncedAt.present ? data.syncedAt.value : this.syncedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalExchange(')
          ..write('id: $id, ')
          ..write('clientUuid: $clientUuid, ')
          ..write('saleId: $saleId, ')
          ..write('saleReferenceNo: $saleReferenceNo, ')
          ..write('warehouseId: $warehouseId, ')
          ..write('customerId: $customerId, ')
          ..write('referenceNo: $referenceNo, ')
          ..write('balance: $balance, ')
          ..write('paymentType: $paymentType, ')
          ..write('payloadJson: $payloadJson, ')
          ..write('syncStatus: $syncStatus, ')
          ..write('serverExchangeId: $serverExchangeId, ')
          ..write('serverReferenceNo: $serverReferenceNo, ')
          ..write('errorMessage: $errorMessage, ')
          ..write('createdAt: $createdAt, ')
          ..write('syncedAt: $syncedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
      id,
      clientUuid,
      saleId,
      saleReferenceNo,
      warehouseId,
      customerId,
      referenceNo,
      balance,
      paymentType,
      payloadJson,
      syncStatus,
      serverExchangeId,
      serverReferenceNo,
      errorMessage,
      createdAt,
      syncedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalExchange &&
          other.id == this.id &&
          other.clientUuid == this.clientUuid &&
          other.saleId == this.saleId &&
          other.saleReferenceNo == this.saleReferenceNo &&
          other.warehouseId == this.warehouseId &&
          other.customerId == this.customerId &&
          other.referenceNo == this.referenceNo &&
          other.balance == this.balance &&
          other.paymentType == this.paymentType &&
          other.payloadJson == this.payloadJson &&
          other.syncStatus == this.syncStatus &&
          other.serverExchangeId == this.serverExchangeId &&
          other.serverReferenceNo == this.serverReferenceNo &&
          other.errorMessage == this.errorMessage &&
          other.createdAt == this.createdAt &&
          other.syncedAt == this.syncedAt);
}

class LocalExchangesCompanion extends UpdateCompanion<LocalExchange> {
  final Value<int> id;
  final Value<String> clientUuid;
  final Value<int?> saleId;
  final Value<String> saleReferenceNo;
  final Value<int> warehouseId;
  final Value<int> customerId;
  final Value<String?> referenceNo;
  final Value<double> balance;
  final Value<String?> paymentType;
  final Value<String> payloadJson;
  final Value<String> syncStatus;
  final Value<int?> serverExchangeId;
  final Value<String?> serverReferenceNo;
  final Value<String?> errorMessage;
  final Value<DateTime> createdAt;
  final Value<DateTime?> syncedAt;
  const LocalExchangesCompanion({
    this.id = const Value.absent(),
    this.clientUuid = const Value.absent(),
    this.saleId = const Value.absent(),
    this.saleReferenceNo = const Value.absent(),
    this.warehouseId = const Value.absent(),
    this.customerId = const Value.absent(),
    this.referenceNo = const Value.absent(),
    this.balance = const Value.absent(),
    this.paymentType = const Value.absent(),
    this.payloadJson = const Value.absent(),
    this.syncStatus = const Value.absent(),
    this.serverExchangeId = const Value.absent(),
    this.serverReferenceNo = const Value.absent(),
    this.errorMessage = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.syncedAt = const Value.absent(),
  });
  LocalExchangesCompanion.insert({
    this.id = const Value.absent(),
    required String clientUuid,
    this.saleId = const Value.absent(),
    required String saleReferenceNo,
    required int warehouseId,
    required int customerId,
    this.referenceNo = const Value.absent(),
    required double balance,
    this.paymentType = const Value.absent(),
    required String payloadJson,
    this.syncStatus = const Value.absent(),
    this.serverExchangeId = const Value.absent(),
    this.serverReferenceNo = const Value.absent(),
    this.errorMessage = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.syncedAt = const Value.absent(),
  })  : clientUuid = Value(clientUuid),
        saleReferenceNo = Value(saleReferenceNo),
        warehouseId = Value(warehouseId),
        customerId = Value(customerId),
        balance = Value(balance),
        payloadJson = Value(payloadJson);
  static Insertable<LocalExchange> custom({
    Expression<int>? id,
    Expression<String>? clientUuid,
    Expression<int>? saleId,
    Expression<String>? saleReferenceNo,
    Expression<int>? warehouseId,
    Expression<int>? customerId,
    Expression<String>? referenceNo,
    Expression<double>? balance,
    Expression<String>? paymentType,
    Expression<String>? payloadJson,
    Expression<String>? syncStatus,
    Expression<int>? serverExchangeId,
    Expression<String>? serverReferenceNo,
    Expression<String>? errorMessage,
    Expression<DateTime>? createdAt,
    Expression<DateTime>? syncedAt,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (clientUuid != null) 'client_uuid': clientUuid,
      if (saleId != null) 'sale_id': saleId,
      if (saleReferenceNo != null) 'sale_reference_no': saleReferenceNo,
      if (warehouseId != null) 'warehouse_id': warehouseId,
      if (customerId != null) 'customer_id': customerId,
      if (referenceNo != null) 'reference_no': referenceNo,
      if (balance != null) 'balance': balance,
      if (paymentType != null) 'payment_type': paymentType,
      if (payloadJson != null) 'payload_json': payloadJson,
      if (syncStatus != null) 'sync_status': syncStatus,
      if (serverExchangeId != null) 'server_exchange_id': serverExchangeId,
      if (serverReferenceNo != null) 'server_reference_no': serverReferenceNo,
      if (errorMessage != null) 'error_message': errorMessage,
      if (createdAt != null) 'created_at': createdAt,
      if (syncedAt != null) 'synced_at': syncedAt,
    });
  }

  LocalExchangesCompanion copyWith(
      {Value<int>? id,
      Value<String>? clientUuid,
      Value<int?>? saleId,
      Value<String>? saleReferenceNo,
      Value<int>? warehouseId,
      Value<int>? customerId,
      Value<String?>? referenceNo,
      Value<double>? balance,
      Value<String?>? paymentType,
      Value<String>? payloadJson,
      Value<String>? syncStatus,
      Value<int?>? serverExchangeId,
      Value<String?>? serverReferenceNo,
      Value<String?>? errorMessage,
      Value<DateTime>? createdAt,
      Value<DateTime?>? syncedAt}) {
    return LocalExchangesCompanion(
      id: id ?? this.id,
      clientUuid: clientUuid ?? this.clientUuid,
      saleId: saleId ?? this.saleId,
      saleReferenceNo: saleReferenceNo ?? this.saleReferenceNo,
      warehouseId: warehouseId ?? this.warehouseId,
      customerId: customerId ?? this.customerId,
      referenceNo: referenceNo ?? this.referenceNo,
      balance: balance ?? this.balance,
      paymentType: paymentType ?? this.paymentType,
      payloadJson: payloadJson ?? this.payloadJson,
      syncStatus: syncStatus ?? this.syncStatus,
      serverExchangeId: serverExchangeId ?? this.serverExchangeId,
      serverReferenceNo: serverReferenceNo ?? this.serverReferenceNo,
      errorMessage: errorMessage ?? this.errorMessage,
      createdAt: createdAt ?? this.createdAt,
      syncedAt: syncedAt ?? this.syncedAt,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (clientUuid.present) {
      map['client_uuid'] = Variable<String>(clientUuid.value);
    }
    if (saleId.present) {
      map['sale_id'] = Variable<int>(saleId.value);
    }
    if (saleReferenceNo.present) {
      map['sale_reference_no'] = Variable<String>(saleReferenceNo.value);
    }
    if (warehouseId.present) {
      map['warehouse_id'] = Variable<int>(warehouseId.value);
    }
    if (customerId.present) {
      map['customer_id'] = Variable<int>(customerId.value);
    }
    if (referenceNo.present) {
      map['reference_no'] = Variable<String>(referenceNo.value);
    }
    if (balance.present) {
      map['balance'] = Variable<double>(balance.value);
    }
    if (paymentType.present) {
      map['payment_type'] = Variable<String>(paymentType.value);
    }
    if (payloadJson.present) {
      map['payload_json'] = Variable<String>(payloadJson.value);
    }
    if (syncStatus.present) {
      map['sync_status'] = Variable<String>(syncStatus.value);
    }
    if (serverExchangeId.present) {
      map['server_exchange_id'] = Variable<int>(serverExchangeId.value);
    }
    if (serverReferenceNo.present) {
      map['server_reference_no'] = Variable<String>(serverReferenceNo.value);
    }
    if (errorMessage.present) {
      map['error_message'] = Variable<String>(errorMessage.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (syncedAt.present) {
      map['synced_at'] = Variable<DateTime>(syncedAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalExchangesCompanion(')
          ..write('id: $id, ')
          ..write('clientUuid: $clientUuid, ')
          ..write('saleId: $saleId, ')
          ..write('saleReferenceNo: $saleReferenceNo, ')
          ..write('warehouseId: $warehouseId, ')
          ..write('customerId: $customerId, ')
          ..write('referenceNo: $referenceNo, ')
          ..write('balance: $balance, ')
          ..write('paymentType: $paymentType, ')
          ..write('payloadJson: $payloadJson, ')
          ..write('syncStatus: $syncStatus, ')
          ..write('serverExchangeId: $serverExchangeId, ')
          ..write('serverReferenceNo: $serverReferenceNo, ')
          ..write('errorMessage: $errorMessage, ')
          ..write('createdAt: $createdAt, ')
          ..write('syncedAt: $syncedAt')
          ..write(')'))
        .toString();
  }
}

abstract class _$AppDatabase extends GeneratedDatabase {
  _$AppDatabase(QueryExecutor e) : super(e);
  $AppDatabaseManager get managers => $AppDatabaseManager(this);
  late final $DeviceSessionTable deviceSession = $DeviceSessionTable(this);
  late final $SyncMetaTable syncMeta = $SyncMetaTable(this);
  late final $WarehousesTable warehouses = $WarehousesTable(this);
  late final $LocalUsersTable localUsers = $LocalUsersTable(this);
  late final $CategoriesTable categories = $CategoriesTable(this);
  late final $BrandsTable brands = $BrandsTable(this);
  late final $TaxesTable taxes = $TaxesTable(this);
  late final $UnitsTable units = $UnitsTable(this);
  late final $CustomersTable customers = $CustomersTable(this);
  late final $LocalCouponsTable localCoupons = $LocalCouponsTable(this);
  late final $BillersTable billers = $BillersTable(this);
  late final $ProductsTable products = $ProductsTable(this);
  late final $ProductVariantsTable productVariants =
      $ProductVariantsTable(this);
  late final $ProductStockTable productStock = $ProductStockTable(this);
  late final $LocalSalesTable localSales = $LocalSalesTable(this);
  late final $LocalSaleLinesTable localSaleLines = $LocalSaleLinesTable(this);
  late final $LocalReturnsTable localReturns = $LocalReturnsTable(this);
  late final $LocalExchangesTable localExchanges = $LocalExchangesTable(this);
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities => [
        deviceSession,
        syncMeta,
        warehouses,
        localUsers,
        categories,
        brands,
        taxes,
        units,
        customers,
        localCoupons,
        billers,
        products,
        productVariants,
        productStock,
        localSales,
        localSaleLines,
        localReturns,
        localExchanges
      ];
}

typedef $$DeviceSessionTableCreateCompanionBuilder = DeviceSessionCompanion
    Function({
  Value<int> id,
  Value<String?> authToken,
  Value<String?> deviceId,
  Value<int?> warehouseId,
  Value<int?> customerId,
  Value<int?> billerId,
  Value<String?> userName,
  Value<int?> userId,
  Value<bool> isProvisioned,
  Value<int?> terminalId,
  Value<String?> terminalCode,
  Value<String?> terminalName,
  Value<String?> posToken,
  Value<String?> clientToken,
  Value<String?> activationToken,
  Value<String?> macAddress,
  Value<String?> posBaseUrl,
  Value<bool> deviceRegistered,
});
typedef $$DeviceSessionTableUpdateCompanionBuilder = DeviceSessionCompanion
    Function({
  Value<int> id,
  Value<String?> authToken,
  Value<String?> deviceId,
  Value<int?> warehouseId,
  Value<int?> customerId,
  Value<int?> billerId,
  Value<String?> userName,
  Value<int?> userId,
  Value<bool> isProvisioned,
  Value<int?> terminalId,
  Value<String?> terminalCode,
  Value<String?> terminalName,
  Value<String?> posToken,
  Value<String?> clientToken,
  Value<String?> activationToken,
  Value<String?> macAddress,
  Value<String?> posBaseUrl,
  Value<bool> deviceRegistered,
});

class $$DeviceSessionTableFilterComposer
    extends Composer<_$AppDatabase, $DeviceSessionTable> {
  $$DeviceSessionTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get authToken => $composableBuilder(
      column: $table.authToken, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get deviceId => $composableBuilder(
      column: $table.deviceId, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get warehouseId => $composableBuilder(
      column: $table.warehouseId, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get customerId => $composableBuilder(
      column: $table.customerId, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get billerId => $composableBuilder(
      column: $table.billerId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get userName => $composableBuilder(
      column: $table.userName, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get userId => $composableBuilder(
      column: $table.userId, builder: (column) => ColumnFilters(column));

  ColumnFilters<bool> get isProvisioned => $composableBuilder(
      column: $table.isProvisioned, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get terminalId => $composableBuilder(
      column: $table.terminalId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get terminalCode => $composableBuilder(
      column: $table.terminalCode, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get terminalName => $composableBuilder(
      column: $table.terminalName, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get posToken => $composableBuilder(
      column: $table.posToken, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get clientToken => $composableBuilder(
      column: $table.clientToken, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get activationToken => $composableBuilder(
      column: $table.activationToken,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get macAddress => $composableBuilder(
      column: $table.macAddress, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get posBaseUrl => $composableBuilder(
      column: $table.posBaseUrl, builder: (column) => ColumnFilters(column));

  ColumnFilters<bool> get deviceRegistered => $composableBuilder(
      column: $table.deviceRegistered,
      builder: (column) => ColumnFilters(column));
}

class $$DeviceSessionTableOrderingComposer
    extends Composer<_$AppDatabase, $DeviceSessionTable> {
  $$DeviceSessionTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get authToken => $composableBuilder(
      column: $table.authToken, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get deviceId => $composableBuilder(
      column: $table.deviceId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get warehouseId => $composableBuilder(
      column: $table.warehouseId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get customerId => $composableBuilder(
      column: $table.customerId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get billerId => $composableBuilder(
      column: $table.billerId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get userName => $composableBuilder(
      column: $table.userName, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get userId => $composableBuilder(
      column: $table.userId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<bool> get isProvisioned => $composableBuilder(
      column: $table.isProvisioned,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get terminalId => $composableBuilder(
      column: $table.terminalId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get terminalCode => $composableBuilder(
      column: $table.terminalCode,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get terminalName => $composableBuilder(
      column: $table.terminalName,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get posToken => $composableBuilder(
      column: $table.posToken, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get clientToken => $composableBuilder(
      column: $table.clientToken, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get activationToken => $composableBuilder(
      column: $table.activationToken,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get macAddress => $composableBuilder(
      column: $table.macAddress, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get posBaseUrl => $composableBuilder(
      column: $table.posBaseUrl, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<bool> get deviceRegistered => $composableBuilder(
      column: $table.deviceRegistered,
      builder: (column) => ColumnOrderings(column));
}

class $$DeviceSessionTableAnnotationComposer
    extends Composer<_$AppDatabase, $DeviceSessionTable> {
  $$DeviceSessionTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get authToken =>
      $composableBuilder(column: $table.authToken, builder: (column) => column);

  GeneratedColumn<String> get deviceId =>
      $composableBuilder(column: $table.deviceId, builder: (column) => column);

  GeneratedColumn<int> get warehouseId => $composableBuilder(
      column: $table.warehouseId, builder: (column) => column);

  GeneratedColumn<int> get customerId => $composableBuilder(
      column: $table.customerId, builder: (column) => column);

  GeneratedColumn<int> get billerId =>
      $composableBuilder(column: $table.billerId, builder: (column) => column);

  GeneratedColumn<String> get userName =>
      $composableBuilder(column: $table.userName, builder: (column) => column);

  GeneratedColumn<int> get userId =>
      $composableBuilder(column: $table.userId, builder: (column) => column);

  GeneratedColumn<bool> get isProvisioned => $composableBuilder(
      column: $table.isProvisioned, builder: (column) => column);

  GeneratedColumn<int> get terminalId => $composableBuilder(
      column: $table.terminalId, builder: (column) => column);

  GeneratedColumn<String> get terminalCode => $composableBuilder(
      column: $table.terminalCode, builder: (column) => column);

  GeneratedColumn<String> get terminalName => $composableBuilder(
      column: $table.terminalName, builder: (column) => column);

  GeneratedColumn<String> get posToken =>
      $composableBuilder(column: $table.posToken, builder: (column) => column);

  GeneratedColumn<String> get clientToken => $composableBuilder(
      column: $table.clientToken, builder: (column) => column);

  GeneratedColumn<String> get activationToken => $composableBuilder(
      column: $table.activationToken, builder: (column) => column);

  GeneratedColumn<String> get macAddress => $composableBuilder(
      column: $table.macAddress, builder: (column) => column);

  GeneratedColumn<String> get posBaseUrl => $composableBuilder(
      column: $table.posBaseUrl, builder: (column) => column);

  GeneratedColumn<bool> get deviceRegistered => $composableBuilder(
      column: $table.deviceRegistered, builder: (column) => column);
}

class $$DeviceSessionTableTableManager extends RootTableManager<
    _$AppDatabase,
    $DeviceSessionTable,
    DeviceSessionData,
    $$DeviceSessionTableFilterComposer,
    $$DeviceSessionTableOrderingComposer,
    $$DeviceSessionTableAnnotationComposer,
    $$DeviceSessionTableCreateCompanionBuilder,
    $$DeviceSessionTableUpdateCompanionBuilder,
    (
      DeviceSessionData,
      BaseReferences<_$AppDatabase, $DeviceSessionTable, DeviceSessionData>
    ),
    DeviceSessionData,
    PrefetchHooks Function()> {
  $$DeviceSessionTableTableManager(_$AppDatabase db, $DeviceSessionTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$DeviceSessionTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$DeviceSessionTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$DeviceSessionTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<int> id = const Value.absent(),
            Value<String?> authToken = const Value.absent(),
            Value<String?> deviceId = const Value.absent(),
            Value<int?> warehouseId = const Value.absent(),
            Value<int?> customerId = const Value.absent(),
            Value<int?> billerId = const Value.absent(),
            Value<String?> userName = const Value.absent(),
            Value<int?> userId = const Value.absent(),
            Value<bool> isProvisioned = const Value.absent(),
            Value<int?> terminalId = const Value.absent(),
            Value<String?> terminalCode = const Value.absent(),
            Value<String?> terminalName = const Value.absent(),
            Value<String?> posToken = const Value.absent(),
            Value<String?> clientToken = const Value.absent(),
            Value<String?> activationToken = const Value.absent(),
            Value<String?> macAddress = const Value.absent(),
            Value<String?> posBaseUrl = const Value.absent(),
            Value<bool> deviceRegistered = const Value.absent(),
          }) =>
              DeviceSessionCompanion(
            id: id,
            authToken: authToken,
            deviceId: deviceId,
            warehouseId: warehouseId,
            customerId: customerId,
            billerId: billerId,
            userName: userName,
            userId: userId,
            isProvisioned: isProvisioned,
            terminalId: terminalId,
            terminalCode: terminalCode,
            terminalName: terminalName,
            posToken: posToken,
            clientToken: clientToken,
            activationToken: activationToken,
            macAddress: macAddress,
            posBaseUrl: posBaseUrl,
            deviceRegistered: deviceRegistered,
          ),
          createCompanionCallback: ({
            Value<int> id = const Value.absent(),
            Value<String?> authToken = const Value.absent(),
            Value<String?> deviceId = const Value.absent(),
            Value<int?> warehouseId = const Value.absent(),
            Value<int?> customerId = const Value.absent(),
            Value<int?> billerId = const Value.absent(),
            Value<String?> userName = const Value.absent(),
            Value<int?> userId = const Value.absent(),
            Value<bool> isProvisioned = const Value.absent(),
            Value<int?> terminalId = const Value.absent(),
            Value<String?> terminalCode = const Value.absent(),
            Value<String?> terminalName = const Value.absent(),
            Value<String?> posToken = const Value.absent(),
            Value<String?> clientToken = const Value.absent(),
            Value<String?> activationToken = const Value.absent(),
            Value<String?> macAddress = const Value.absent(),
            Value<String?> posBaseUrl = const Value.absent(),
            Value<bool> deviceRegistered = const Value.absent(),
          }) =>
              DeviceSessionCompanion.insert(
            id: id,
            authToken: authToken,
            deviceId: deviceId,
            warehouseId: warehouseId,
            customerId: customerId,
            billerId: billerId,
            userName: userName,
            userId: userId,
            isProvisioned: isProvisioned,
            terminalId: terminalId,
            terminalCode: terminalCode,
            terminalName: terminalName,
            posToken: posToken,
            clientToken: clientToken,
            activationToken: activationToken,
            macAddress: macAddress,
            posBaseUrl: posBaseUrl,
            deviceRegistered: deviceRegistered,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$DeviceSessionTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $DeviceSessionTable,
    DeviceSessionData,
    $$DeviceSessionTableFilterComposer,
    $$DeviceSessionTableOrderingComposer,
    $$DeviceSessionTableAnnotationComposer,
    $$DeviceSessionTableCreateCompanionBuilder,
    $$DeviceSessionTableUpdateCompanionBuilder,
    (
      DeviceSessionData,
      BaseReferences<_$AppDatabase, $DeviceSessionTable, DeviceSessionData>
    ),
    DeviceSessionData,
    PrefetchHooks Function()>;
typedef $$SyncMetaTableCreateCompanionBuilder = SyncMetaCompanion Function({
  Value<int> id,
  required String deviceId,
  required int warehouseId,
  Value<String?> lastCatalogSyncAt,
  Value<String?> lastFullDownloadAt,
  Value<int?> defaultCustomerId,
  Value<int?> defaultBillerId,
  Value<String?> posSettingsJson,
});
typedef $$SyncMetaTableUpdateCompanionBuilder = SyncMetaCompanion Function({
  Value<int> id,
  Value<String> deviceId,
  Value<int> warehouseId,
  Value<String?> lastCatalogSyncAt,
  Value<String?> lastFullDownloadAt,
  Value<int?> defaultCustomerId,
  Value<int?> defaultBillerId,
  Value<String?> posSettingsJson,
});

class $$SyncMetaTableFilterComposer
    extends Composer<_$AppDatabase, $SyncMetaTable> {
  $$SyncMetaTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get deviceId => $composableBuilder(
      column: $table.deviceId, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get warehouseId => $composableBuilder(
      column: $table.warehouseId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get lastCatalogSyncAt => $composableBuilder(
      column: $table.lastCatalogSyncAt,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get lastFullDownloadAt => $composableBuilder(
      column: $table.lastFullDownloadAt,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get defaultCustomerId => $composableBuilder(
      column: $table.defaultCustomerId,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get defaultBillerId => $composableBuilder(
      column: $table.defaultBillerId,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get posSettingsJson => $composableBuilder(
      column: $table.posSettingsJson,
      builder: (column) => ColumnFilters(column));
}

class $$SyncMetaTableOrderingComposer
    extends Composer<_$AppDatabase, $SyncMetaTable> {
  $$SyncMetaTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get deviceId => $composableBuilder(
      column: $table.deviceId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get warehouseId => $composableBuilder(
      column: $table.warehouseId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get lastCatalogSyncAt => $composableBuilder(
      column: $table.lastCatalogSyncAt,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get lastFullDownloadAt => $composableBuilder(
      column: $table.lastFullDownloadAt,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get defaultCustomerId => $composableBuilder(
      column: $table.defaultCustomerId,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get defaultBillerId => $composableBuilder(
      column: $table.defaultBillerId,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get posSettingsJson => $composableBuilder(
      column: $table.posSettingsJson,
      builder: (column) => ColumnOrderings(column));
}

class $$SyncMetaTableAnnotationComposer
    extends Composer<_$AppDatabase, $SyncMetaTable> {
  $$SyncMetaTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get deviceId =>
      $composableBuilder(column: $table.deviceId, builder: (column) => column);

  GeneratedColumn<int> get warehouseId => $composableBuilder(
      column: $table.warehouseId, builder: (column) => column);

  GeneratedColumn<String> get lastCatalogSyncAt => $composableBuilder(
      column: $table.lastCatalogSyncAt, builder: (column) => column);

  GeneratedColumn<String> get lastFullDownloadAt => $composableBuilder(
      column: $table.lastFullDownloadAt, builder: (column) => column);

  GeneratedColumn<int> get defaultCustomerId => $composableBuilder(
      column: $table.defaultCustomerId, builder: (column) => column);

  GeneratedColumn<int> get defaultBillerId => $composableBuilder(
      column: $table.defaultBillerId, builder: (column) => column);

  GeneratedColumn<String> get posSettingsJson => $composableBuilder(
      column: $table.posSettingsJson, builder: (column) => column);
}

class $$SyncMetaTableTableManager extends RootTableManager<
    _$AppDatabase,
    $SyncMetaTable,
    SyncMetaData,
    $$SyncMetaTableFilterComposer,
    $$SyncMetaTableOrderingComposer,
    $$SyncMetaTableAnnotationComposer,
    $$SyncMetaTableCreateCompanionBuilder,
    $$SyncMetaTableUpdateCompanionBuilder,
    (SyncMetaData, BaseReferences<_$AppDatabase, $SyncMetaTable, SyncMetaData>),
    SyncMetaData,
    PrefetchHooks Function()> {
  $$SyncMetaTableTableManager(_$AppDatabase db, $SyncMetaTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$SyncMetaTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$SyncMetaTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$SyncMetaTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<int> id = const Value.absent(),
            Value<String> deviceId = const Value.absent(),
            Value<int> warehouseId = const Value.absent(),
            Value<String?> lastCatalogSyncAt = const Value.absent(),
            Value<String?> lastFullDownloadAt = const Value.absent(),
            Value<int?> defaultCustomerId = const Value.absent(),
            Value<int?> defaultBillerId = const Value.absent(),
            Value<String?> posSettingsJson = const Value.absent(),
          }) =>
              SyncMetaCompanion(
            id: id,
            deviceId: deviceId,
            warehouseId: warehouseId,
            lastCatalogSyncAt: lastCatalogSyncAt,
            lastFullDownloadAt: lastFullDownloadAt,
            defaultCustomerId: defaultCustomerId,
            defaultBillerId: defaultBillerId,
            posSettingsJson: posSettingsJson,
          ),
          createCompanionCallback: ({
            Value<int> id = const Value.absent(),
            required String deviceId,
            required int warehouseId,
            Value<String?> lastCatalogSyncAt = const Value.absent(),
            Value<String?> lastFullDownloadAt = const Value.absent(),
            Value<int?> defaultCustomerId = const Value.absent(),
            Value<int?> defaultBillerId = const Value.absent(),
            Value<String?> posSettingsJson = const Value.absent(),
          }) =>
              SyncMetaCompanion.insert(
            id: id,
            deviceId: deviceId,
            warehouseId: warehouseId,
            lastCatalogSyncAt: lastCatalogSyncAt,
            lastFullDownloadAt: lastFullDownloadAt,
            defaultCustomerId: defaultCustomerId,
            defaultBillerId: defaultBillerId,
            posSettingsJson: posSettingsJson,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$SyncMetaTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $SyncMetaTable,
    SyncMetaData,
    $$SyncMetaTableFilterComposer,
    $$SyncMetaTableOrderingComposer,
    $$SyncMetaTableAnnotationComposer,
    $$SyncMetaTableCreateCompanionBuilder,
    $$SyncMetaTableUpdateCompanionBuilder,
    (SyncMetaData, BaseReferences<_$AppDatabase, $SyncMetaTable, SyncMetaData>),
    SyncMetaData,
    PrefetchHooks Function()>;
typedef $$WarehousesTableCreateCompanionBuilder = WarehousesCompanion Function({
  Value<int> id,
  required String name,
  Value<String?> phone,
  Value<String?> email,
  Value<String?> address,
  Value<String?> updatedAt,
});
typedef $$WarehousesTableUpdateCompanionBuilder = WarehousesCompanion Function({
  Value<int> id,
  Value<String> name,
  Value<String?> phone,
  Value<String?> email,
  Value<String?> address,
  Value<String?> updatedAt,
});

class $$WarehousesTableFilterComposer
    extends Composer<_$AppDatabase, $WarehousesTable> {
  $$WarehousesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get phone => $composableBuilder(
      column: $table.phone, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get email => $composableBuilder(
      column: $table.email, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get address => $composableBuilder(
      column: $table.address, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnFilters(column));
}

class $$WarehousesTableOrderingComposer
    extends Composer<_$AppDatabase, $WarehousesTable> {
  $$WarehousesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get phone => $composableBuilder(
      column: $table.phone, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get email => $composableBuilder(
      column: $table.email, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get address => $composableBuilder(
      column: $table.address, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnOrderings(column));
}

class $$WarehousesTableAnnotationComposer
    extends Composer<_$AppDatabase, $WarehousesTable> {
  $$WarehousesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  GeneratedColumn<String> get phone =>
      $composableBuilder(column: $table.phone, builder: (column) => column);

  GeneratedColumn<String> get email =>
      $composableBuilder(column: $table.email, builder: (column) => column);

  GeneratedColumn<String> get address =>
      $composableBuilder(column: $table.address, builder: (column) => column);

  GeneratedColumn<String> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$WarehousesTableTableManager extends RootTableManager<
    _$AppDatabase,
    $WarehousesTable,
    Warehouse,
    $$WarehousesTableFilterComposer,
    $$WarehousesTableOrderingComposer,
    $$WarehousesTableAnnotationComposer,
    $$WarehousesTableCreateCompanionBuilder,
    $$WarehousesTableUpdateCompanionBuilder,
    (Warehouse, BaseReferences<_$AppDatabase, $WarehousesTable, Warehouse>),
    Warehouse,
    PrefetchHooks Function()> {
  $$WarehousesTableTableManager(_$AppDatabase db, $WarehousesTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$WarehousesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$WarehousesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$WarehousesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<int> id = const Value.absent(),
            Value<String> name = const Value.absent(),
            Value<String?> phone = const Value.absent(),
            Value<String?> email = const Value.absent(),
            Value<String?> address = const Value.absent(),
            Value<String?> updatedAt = const Value.absent(),
          }) =>
              WarehousesCompanion(
            id: id,
            name: name,
            phone: phone,
            email: email,
            address: address,
            updatedAt: updatedAt,
          ),
          createCompanionCallback: ({
            Value<int> id = const Value.absent(),
            required String name,
            Value<String?> phone = const Value.absent(),
            Value<String?> email = const Value.absent(),
            Value<String?> address = const Value.absent(),
            Value<String?> updatedAt = const Value.absent(),
          }) =>
              WarehousesCompanion.insert(
            id: id,
            name: name,
            phone: phone,
            email: email,
            address: address,
            updatedAt: updatedAt,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$WarehousesTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $WarehousesTable,
    Warehouse,
    $$WarehousesTableFilterComposer,
    $$WarehousesTableOrderingComposer,
    $$WarehousesTableAnnotationComposer,
    $$WarehousesTableCreateCompanionBuilder,
    $$WarehousesTableUpdateCompanionBuilder,
    (Warehouse, BaseReferences<_$AppDatabase, $WarehousesTable, Warehouse>),
    Warehouse,
    PrefetchHooks Function()>;
typedef $$LocalUsersTableCreateCompanionBuilder = LocalUsersCompanion Function({
  Value<int> id,
  required String name,
  Value<String?> username,
  Value<String?> email,
  required String passwordHash,
  Value<String?> accessPinHash,
  Value<int?> warehouseId,
  Value<int?> roleId,
  Value<int?> billerId,
  Value<String?> updatedAt,
});
typedef $$LocalUsersTableUpdateCompanionBuilder = LocalUsersCompanion Function({
  Value<int> id,
  Value<String> name,
  Value<String?> username,
  Value<String?> email,
  Value<String> passwordHash,
  Value<String?> accessPinHash,
  Value<int?> warehouseId,
  Value<int?> roleId,
  Value<int?> billerId,
  Value<String?> updatedAt,
});

class $$LocalUsersTableFilterComposer
    extends Composer<_$AppDatabase, $LocalUsersTable> {
  $$LocalUsersTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get username => $composableBuilder(
      column: $table.username, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get email => $composableBuilder(
      column: $table.email, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get passwordHash => $composableBuilder(
      column: $table.passwordHash, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get accessPinHash => $composableBuilder(
      column: $table.accessPinHash, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get warehouseId => $composableBuilder(
      column: $table.warehouseId, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get roleId => $composableBuilder(
      column: $table.roleId, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get billerId => $composableBuilder(
      column: $table.billerId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnFilters(column));
}

class $$LocalUsersTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalUsersTable> {
  $$LocalUsersTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get username => $composableBuilder(
      column: $table.username, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get email => $composableBuilder(
      column: $table.email, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get passwordHash => $composableBuilder(
      column: $table.passwordHash,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get accessPinHash => $composableBuilder(
      column: $table.accessPinHash,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get warehouseId => $composableBuilder(
      column: $table.warehouseId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get roleId => $composableBuilder(
      column: $table.roleId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get billerId => $composableBuilder(
      column: $table.billerId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnOrderings(column));
}

class $$LocalUsersTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalUsersTable> {
  $$LocalUsersTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  GeneratedColumn<String> get username =>
      $composableBuilder(column: $table.username, builder: (column) => column);

  GeneratedColumn<String> get email =>
      $composableBuilder(column: $table.email, builder: (column) => column);

  GeneratedColumn<String> get passwordHash => $composableBuilder(
      column: $table.passwordHash, builder: (column) => column);

  GeneratedColumn<String> get accessPinHash => $composableBuilder(
      column: $table.accessPinHash, builder: (column) => column);

  GeneratedColumn<int> get warehouseId => $composableBuilder(
      column: $table.warehouseId, builder: (column) => column);

  GeneratedColumn<int> get roleId =>
      $composableBuilder(column: $table.roleId, builder: (column) => column);

  GeneratedColumn<int> get billerId =>
      $composableBuilder(column: $table.billerId, builder: (column) => column);

  GeneratedColumn<String> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$LocalUsersTableTableManager extends RootTableManager<
    _$AppDatabase,
    $LocalUsersTable,
    LocalUser,
    $$LocalUsersTableFilterComposer,
    $$LocalUsersTableOrderingComposer,
    $$LocalUsersTableAnnotationComposer,
    $$LocalUsersTableCreateCompanionBuilder,
    $$LocalUsersTableUpdateCompanionBuilder,
    (LocalUser, BaseReferences<_$AppDatabase, $LocalUsersTable, LocalUser>),
    LocalUser,
    PrefetchHooks Function()> {
  $$LocalUsersTableTableManager(_$AppDatabase db, $LocalUsersTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalUsersTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalUsersTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalUsersTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<int> id = const Value.absent(),
            Value<String> name = const Value.absent(),
            Value<String?> username = const Value.absent(),
            Value<String?> email = const Value.absent(),
            Value<String> passwordHash = const Value.absent(),
            Value<String?> accessPinHash = const Value.absent(),
            Value<int?> warehouseId = const Value.absent(),
            Value<int?> roleId = const Value.absent(),
            Value<int?> billerId = const Value.absent(),
            Value<String?> updatedAt = const Value.absent(),
          }) =>
              LocalUsersCompanion(
            id: id,
            name: name,
            username: username,
            email: email,
            passwordHash: passwordHash,
            accessPinHash: accessPinHash,
            warehouseId: warehouseId,
            roleId: roleId,
            billerId: billerId,
            updatedAt: updatedAt,
          ),
          createCompanionCallback: ({
            Value<int> id = const Value.absent(),
            required String name,
            Value<String?> username = const Value.absent(),
            Value<String?> email = const Value.absent(),
            required String passwordHash,
            Value<String?> accessPinHash = const Value.absent(),
            Value<int?> warehouseId = const Value.absent(),
            Value<int?> roleId = const Value.absent(),
            Value<int?> billerId = const Value.absent(),
            Value<String?> updatedAt = const Value.absent(),
          }) =>
              LocalUsersCompanion.insert(
            id: id,
            name: name,
            username: username,
            email: email,
            passwordHash: passwordHash,
            accessPinHash: accessPinHash,
            warehouseId: warehouseId,
            roleId: roleId,
            billerId: billerId,
            updatedAt: updatedAt,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$LocalUsersTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $LocalUsersTable,
    LocalUser,
    $$LocalUsersTableFilterComposer,
    $$LocalUsersTableOrderingComposer,
    $$LocalUsersTableAnnotationComposer,
    $$LocalUsersTableCreateCompanionBuilder,
    $$LocalUsersTableUpdateCompanionBuilder,
    (LocalUser, BaseReferences<_$AppDatabase, $LocalUsersTable, LocalUser>),
    LocalUser,
    PrefetchHooks Function()>;
typedef $$CategoriesTableCreateCompanionBuilder = CategoriesCompanion Function({
  Value<int> id,
  required String name,
  Value<String?> image,
  Value<String?> updatedAt,
});
typedef $$CategoriesTableUpdateCompanionBuilder = CategoriesCompanion Function({
  Value<int> id,
  Value<String> name,
  Value<String?> image,
  Value<String?> updatedAt,
});

class $$CategoriesTableFilterComposer
    extends Composer<_$AppDatabase, $CategoriesTable> {
  $$CategoriesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get image => $composableBuilder(
      column: $table.image, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnFilters(column));
}

class $$CategoriesTableOrderingComposer
    extends Composer<_$AppDatabase, $CategoriesTable> {
  $$CategoriesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get image => $composableBuilder(
      column: $table.image, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnOrderings(column));
}

class $$CategoriesTableAnnotationComposer
    extends Composer<_$AppDatabase, $CategoriesTable> {
  $$CategoriesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  GeneratedColumn<String> get image =>
      $composableBuilder(column: $table.image, builder: (column) => column);

  GeneratedColumn<String> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$CategoriesTableTableManager extends RootTableManager<
    _$AppDatabase,
    $CategoriesTable,
    Category,
    $$CategoriesTableFilterComposer,
    $$CategoriesTableOrderingComposer,
    $$CategoriesTableAnnotationComposer,
    $$CategoriesTableCreateCompanionBuilder,
    $$CategoriesTableUpdateCompanionBuilder,
    (Category, BaseReferences<_$AppDatabase, $CategoriesTable, Category>),
    Category,
    PrefetchHooks Function()> {
  $$CategoriesTableTableManager(_$AppDatabase db, $CategoriesTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$CategoriesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$CategoriesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$CategoriesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<int> id = const Value.absent(),
            Value<String> name = const Value.absent(),
            Value<String?> image = const Value.absent(),
            Value<String?> updatedAt = const Value.absent(),
          }) =>
              CategoriesCompanion(
            id: id,
            name: name,
            image: image,
            updatedAt: updatedAt,
          ),
          createCompanionCallback: ({
            Value<int> id = const Value.absent(),
            required String name,
            Value<String?> image = const Value.absent(),
            Value<String?> updatedAt = const Value.absent(),
          }) =>
              CategoriesCompanion.insert(
            id: id,
            name: name,
            image: image,
            updatedAt: updatedAt,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$CategoriesTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $CategoriesTable,
    Category,
    $$CategoriesTableFilterComposer,
    $$CategoriesTableOrderingComposer,
    $$CategoriesTableAnnotationComposer,
    $$CategoriesTableCreateCompanionBuilder,
    $$CategoriesTableUpdateCompanionBuilder,
    (Category, BaseReferences<_$AppDatabase, $CategoriesTable, Category>),
    Category,
    PrefetchHooks Function()>;
typedef $$BrandsTableCreateCompanionBuilder = BrandsCompanion Function({
  Value<int> id,
  required String name,
  Value<String?> image,
  Value<String?> updatedAt,
});
typedef $$BrandsTableUpdateCompanionBuilder = BrandsCompanion Function({
  Value<int> id,
  Value<String> name,
  Value<String?> image,
  Value<String?> updatedAt,
});

class $$BrandsTableFilterComposer
    extends Composer<_$AppDatabase, $BrandsTable> {
  $$BrandsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get image => $composableBuilder(
      column: $table.image, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnFilters(column));
}

class $$BrandsTableOrderingComposer
    extends Composer<_$AppDatabase, $BrandsTable> {
  $$BrandsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get image => $composableBuilder(
      column: $table.image, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnOrderings(column));
}

class $$BrandsTableAnnotationComposer
    extends Composer<_$AppDatabase, $BrandsTable> {
  $$BrandsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  GeneratedColumn<String> get image =>
      $composableBuilder(column: $table.image, builder: (column) => column);

  GeneratedColumn<String> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$BrandsTableTableManager extends RootTableManager<
    _$AppDatabase,
    $BrandsTable,
    Brand,
    $$BrandsTableFilterComposer,
    $$BrandsTableOrderingComposer,
    $$BrandsTableAnnotationComposer,
    $$BrandsTableCreateCompanionBuilder,
    $$BrandsTableUpdateCompanionBuilder,
    (Brand, BaseReferences<_$AppDatabase, $BrandsTable, Brand>),
    Brand,
    PrefetchHooks Function()> {
  $$BrandsTableTableManager(_$AppDatabase db, $BrandsTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$BrandsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$BrandsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$BrandsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<int> id = const Value.absent(),
            Value<String> name = const Value.absent(),
            Value<String?> image = const Value.absent(),
            Value<String?> updatedAt = const Value.absent(),
          }) =>
              BrandsCompanion(
            id: id,
            name: name,
            image: image,
            updatedAt: updatedAt,
          ),
          createCompanionCallback: ({
            Value<int> id = const Value.absent(),
            required String name,
            Value<String?> image = const Value.absent(),
            Value<String?> updatedAt = const Value.absent(),
          }) =>
              BrandsCompanion.insert(
            id: id,
            name: name,
            image: image,
            updatedAt: updatedAt,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$BrandsTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $BrandsTable,
    Brand,
    $$BrandsTableFilterComposer,
    $$BrandsTableOrderingComposer,
    $$BrandsTableAnnotationComposer,
    $$BrandsTableCreateCompanionBuilder,
    $$BrandsTableUpdateCompanionBuilder,
    (Brand, BaseReferences<_$AppDatabase, $BrandsTable, Brand>),
    Brand,
    PrefetchHooks Function()>;
typedef $$TaxesTableCreateCompanionBuilder = TaxesCompanion Function({
  Value<int> id,
  required String name,
  Value<double> rate,
  Value<String?> updatedAt,
});
typedef $$TaxesTableUpdateCompanionBuilder = TaxesCompanion Function({
  Value<int> id,
  Value<String> name,
  Value<double> rate,
  Value<String?> updatedAt,
});

class $$TaxesTableFilterComposer extends Composer<_$AppDatabase, $TaxesTable> {
  $$TaxesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get rate => $composableBuilder(
      column: $table.rate, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnFilters(column));
}

class $$TaxesTableOrderingComposer
    extends Composer<_$AppDatabase, $TaxesTable> {
  $$TaxesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get rate => $composableBuilder(
      column: $table.rate, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnOrderings(column));
}

class $$TaxesTableAnnotationComposer
    extends Composer<_$AppDatabase, $TaxesTable> {
  $$TaxesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  GeneratedColumn<double> get rate =>
      $composableBuilder(column: $table.rate, builder: (column) => column);

  GeneratedColumn<String> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$TaxesTableTableManager extends RootTableManager<
    _$AppDatabase,
    $TaxesTable,
    Taxe,
    $$TaxesTableFilterComposer,
    $$TaxesTableOrderingComposer,
    $$TaxesTableAnnotationComposer,
    $$TaxesTableCreateCompanionBuilder,
    $$TaxesTableUpdateCompanionBuilder,
    (Taxe, BaseReferences<_$AppDatabase, $TaxesTable, Taxe>),
    Taxe,
    PrefetchHooks Function()> {
  $$TaxesTableTableManager(_$AppDatabase db, $TaxesTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$TaxesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$TaxesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$TaxesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<int> id = const Value.absent(),
            Value<String> name = const Value.absent(),
            Value<double> rate = const Value.absent(),
            Value<String?> updatedAt = const Value.absent(),
          }) =>
              TaxesCompanion(
            id: id,
            name: name,
            rate: rate,
            updatedAt: updatedAt,
          ),
          createCompanionCallback: ({
            Value<int> id = const Value.absent(),
            required String name,
            Value<double> rate = const Value.absent(),
            Value<String?> updatedAt = const Value.absent(),
          }) =>
              TaxesCompanion.insert(
            id: id,
            name: name,
            rate: rate,
            updatedAt: updatedAt,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$TaxesTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $TaxesTable,
    Taxe,
    $$TaxesTableFilterComposer,
    $$TaxesTableOrderingComposer,
    $$TaxesTableAnnotationComposer,
    $$TaxesTableCreateCompanionBuilder,
    $$TaxesTableUpdateCompanionBuilder,
    (Taxe, BaseReferences<_$AppDatabase, $TaxesTable, Taxe>),
    Taxe,
    PrefetchHooks Function()>;
typedef $$UnitsTableCreateCompanionBuilder = UnitsCompanion Function({
  Value<int> id,
  Value<String?> unitCode,
  required String unitName,
  Value<int?> baseUnit,
  Value<String?> operator,
  Value<double> operationValue,
  Value<String?> updatedAt,
});
typedef $$UnitsTableUpdateCompanionBuilder = UnitsCompanion Function({
  Value<int> id,
  Value<String?> unitCode,
  Value<String> unitName,
  Value<int?> baseUnit,
  Value<String?> operator,
  Value<double> operationValue,
  Value<String?> updatedAt,
});

class $$UnitsTableFilterComposer extends Composer<_$AppDatabase, $UnitsTable> {
  $$UnitsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get unitCode => $composableBuilder(
      column: $table.unitCode, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get unitName => $composableBuilder(
      column: $table.unitName, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get baseUnit => $composableBuilder(
      column: $table.baseUnit, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get operator => $composableBuilder(
      column: $table.operator, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get operationValue => $composableBuilder(
      column: $table.operationValue,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnFilters(column));
}

class $$UnitsTableOrderingComposer
    extends Composer<_$AppDatabase, $UnitsTable> {
  $$UnitsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get unitCode => $composableBuilder(
      column: $table.unitCode, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get unitName => $composableBuilder(
      column: $table.unitName, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get baseUnit => $composableBuilder(
      column: $table.baseUnit, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get operator => $composableBuilder(
      column: $table.operator, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get operationValue => $composableBuilder(
      column: $table.operationValue,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnOrderings(column));
}

class $$UnitsTableAnnotationComposer
    extends Composer<_$AppDatabase, $UnitsTable> {
  $$UnitsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get unitCode =>
      $composableBuilder(column: $table.unitCode, builder: (column) => column);

  GeneratedColumn<String> get unitName =>
      $composableBuilder(column: $table.unitName, builder: (column) => column);

  GeneratedColumn<int> get baseUnit =>
      $composableBuilder(column: $table.baseUnit, builder: (column) => column);

  GeneratedColumn<String> get operator =>
      $composableBuilder(column: $table.operator, builder: (column) => column);

  GeneratedColumn<double> get operationValue => $composableBuilder(
      column: $table.operationValue, builder: (column) => column);

  GeneratedColumn<String> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$UnitsTableTableManager extends RootTableManager<
    _$AppDatabase,
    $UnitsTable,
    Unit,
    $$UnitsTableFilterComposer,
    $$UnitsTableOrderingComposer,
    $$UnitsTableAnnotationComposer,
    $$UnitsTableCreateCompanionBuilder,
    $$UnitsTableUpdateCompanionBuilder,
    (Unit, BaseReferences<_$AppDatabase, $UnitsTable, Unit>),
    Unit,
    PrefetchHooks Function()> {
  $$UnitsTableTableManager(_$AppDatabase db, $UnitsTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$UnitsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$UnitsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$UnitsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<int> id = const Value.absent(),
            Value<String?> unitCode = const Value.absent(),
            Value<String> unitName = const Value.absent(),
            Value<int?> baseUnit = const Value.absent(),
            Value<String?> operator = const Value.absent(),
            Value<double> operationValue = const Value.absent(),
            Value<String?> updatedAt = const Value.absent(),
          }) =>
              UnitsCompanion(
            id: id,
            unitCode: unitCode,
            unitName: unitName,
            baseUnit: baseUnit,
            operator: operator,
            operationValue: operationValue,
            updatedAt: updatedAt,
          ),
          createCompanionCallback: ({
            Value<int> id = const Value.absent(),
            Value<String?> unitCode = const Value.absent(),
            required String unitName,
            Value<int?> baseUnit = const Value.absent(),
            Value<String?> operator = const Value.absent(),
            Value<double> operationValue = const Value.absent(),
            Value<String?> updatedAt = const Value.absent(),
          }) =>
              UnitsCompanion.insert(
            id: id,
            unitCode: unitCode,
            unitName: unitName,
            baseUnit: baseUnit,
            operator: operator,
            operationValue: operationValue,
            updatedAt: updatedAt,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$UnitsTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $UnitsTable,
    Unit,
    $$UnitsTableFilterComposer,
    $$UnitsTableOrderingComposer,
    $$UnitsTableAnnotationComposer,
    $$UnitsTableCreateCompanionBuilder,
    $$UnitsTableUpdateCompanionBuilder,
    (Unit, BaseReferences<_$AppDatabase, $UnitsTable, Unit>),
    Unit,
    PrefetchHooks Function()>;
typedef $$CustomersTableCreateCompanionBuilder = CustomersCompanion Function({
  Value<int> id,
  required String name,
  Value<String?> phoneNumber,
  Value<String?> email,
  Value<String?> city,
  Value<int?> customerGroupId,
  Value<String?> updatedAt,
});
typedef $$CustomersTableUpdateCompanionBuilder = CustomersCompanion Function({
  Value<int> id,
  Value<String> name,
  Value<String?> phoneNumber,
  Value<String?> email,
  Value<String?> city,
  Value<int?> customerGroupId,
  Value<String?> updatedAt,
});

class $$CustomersTableFilterComposer
    extends Composer<_$AppDatabase, $CustomersTable> {
  $$CustomersTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get phoneNumber => $composableBuilder(
      column: $table.phoneNumber, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get email => $composableBuilder(
      column: $table.email, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get city => $composableBuilder(
      column: $table.city, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get customerGroupId => $composableBuilder(
      column: $table.customerGroupId,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnFilters(column));
}

class $$CustomersTableOrderingComposer
    extends Composer<_$AppDatabase, $CustomersTable> {
  $$CustomersTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get phoneNumber => $composableBuilder(
      column: $table.phoneNumber, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get email => $composableBuilder(
      column: $table.email, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get city => $composableBuilder(
      column: $table.city, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get customerGroupId => $composableBuilder(
      column: $table.customerGroupId,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnOrderings(column));
}

class $$CustomersTableAnnotationComposer
    extends Composer<_$AppDatabase, $CustomersTable> {
  $$CustomersTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  GeneratedColumn<String> get phoneNumber => $composableBuilder(
      column: $table.phoneNumber, builder: (column) => column);

  GeneratedColumn<String> get email =>
      $composableBuilder(column: $table.email, builder: (column) => column);

  GeneratedColumn<String> get city =>
      $composableBuilder(column: $table.city, builder: (column) => column);

  GeneratedColumn<int> get customerGroupId => $composableBuilder(
      column: $table.customerGroupId, builder: (column) => column);

  GeneratedColumn<String> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$CustomersTableTableManager extends RootTableManager<
    _$AppDatabase,
    $CustomersTable,
    Customer,
    $$CustomersTableFilterComposer,
    $$CustomersTableOrderingComposer,
    $$CustomersTableAnnotationComposer,
    $$CustomersTableCreateCompanionBuilder,
    $$CustomersTableUpdateCompanionBuilder,
    (Customer, BaseReferences<_$AppDatabase, $CustomersTable, Customer>),
    Customer,
    PrefetchHooks Function()> {
  $$CustomersTableTableManager(_$AppDatabase db, $CustomersTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$CustomersTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$CustomersTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$CustomersTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<int> id = const Value.absent(),
            Value<String> name = const Value.absent(),
            Value<String?> phoneNumber = const Value.absent(),
            Value<String?> email = const Value.absent(),
            Value<String?> city = const Value.absent(),
            Value<int?> customerGroupId = const Value.absent(),
            Value<String?> updatedAt = const Value.absent(),
          }) =>
              CustomersCompanion(
            id: id,
            name: name,
            phoneNumber: phoneNumber,
            email: email,
            city: city,
            customerGroupId: customerGroupId,
            updatedAt: updatedAt,
          ),
          createCompanionCallback: ({
            Value<int> id = const Value.absent(),
            required String name,
            Value<String?> phoneNumber = const Value.absent(),
            Value<String?> email = const Value.absent(),
            Value<String?> city = const Value.absent(),
            Value<int?> customerGroupId = const Value.absent(),
            Value<String?> updatedAt = const Value.absent(),
          }) =>
              CustomersCompanion.insert(
            id: id,
            name: name,
            phoneNumber: phoneNumber,
            email: email,
            city: city,
            customerGroupId: customerGroupId,
            updatedAt: updatedAt,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$CustomersTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $CustomersTable,
    Customer,
    $$CustomersTableFilterComposer,
    $$CustomersTableOrderingComposer,
    $$CustomersTableAnnotationComposer,
    $$CustomersTableCreateCompanionBuilder,
    $$CustomersTableUpdateCompanionBuilder,
    (Customer, BaseReferences<_$AppDatabase, $CustomersTable, Customer>),
    Customer,
    PrefetchHooks Function()>;
typedef $$LocalCouponsTableCreateCompanionBuilder = LocalCouponsCompanion
    Function({
  Value<int> id,
  required String code,
  Value<String> type,
  Value<double> amount,
  Value<double> minimumAmount,
  Value<double?> quantity,
  Value<double> used,
  Value<String?> expiredDate,
  Value<String?> updatedAt,
});
typedef $$LocalCouponsTableUpdateCompanionBuilder = LocalCouponsCompanion
    Function({
  Value<int> id,
  Value<String> code,
  Value<String> type,
  Value<double> amount,
  Value<double> minimumAmount,
  Value<double?> quantity,
  Value<double> used,
  Value<String?> expiredDate,
  Value<String?> updatedAt,
});

class $$LocalCouponsTableFilterComposer
    extends Composer<_$AppDatabase, $LocalCouponsTable> {
  $$LocalCouponsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get code => $composableBuilder(
      column: $table.code, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get type => $composableBuilder(
      column: $table.type, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get amount => $composableBuilder(
      column: $table.amount, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get minimumAmount => $composableBuilder(
      column: $table.minimumAmount, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get quantity => $composableBuilder(
      column: $table.quantity, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get used => $composableBuilder(
      column: $table.used, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get expiredDate => $composableBuilder(
      column: $table.expiredDate, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnFilters(column));
}

class $$LocalCouponsTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalCouponsTable> {
  $$LocalCouponsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get code => $composableBuilder(
      column: $table.code, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get type => $composableBuilder(
      column: $table.type, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get amount => $composableBuilder(
      column: $table.amount, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get minimumAmount => $composableBuilder(
      column: $table.minimumAmount,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get quantity => $composableBuilder(
      column: $table.quantity, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get used => $composableBuilder(
      column: $table.used, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get expiredDate => $composableBuilder(
      column: $table.expiredDate, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnOrderings(column));
}

class $$LocalCouponsTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalCouponsTable> {
  $$LocalCouponsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get code =>
      $composableBuilder(column: $table.code, builder: (column) => column);

  GeneratedColumn<String> get type =>
      $composableBuilder(column: $table.type, builder: (column) => column);

  GeneratedColumn<double> get amount =>
      $composableBuilder(column: $table.amount, builder: (column) => column);

  GeneratedColumn<double> get minimumAmount => $composableBuilder(
      column: $table.minimumAmount, builder: (column) => column);

  GeneratedColumn<double> get quantity =>
      $composableBuilder(column: $table.quantity, builder: (column) => column);

  GeneratedColumn<double> get used =>
      $composableBuilder(column: $table.used, builder: (column) => column);

  GeneratedColumn<String> get expiredDate => $composableBuilder(
      column: $table.expiredDate, builder: (column) => column);

  GeneratedColumn<String> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$LocalCouponsTableTableManager extends RootTableManager<
    _$AppDatabase,
    $LocalCouponsTable,
    LocalCoupon,
    $$LocalCouponsTableFilterComposer,
    $$LocalCouponsTableOrderingComposer,
    $$LocalCouponsTableAnnotationComposer,
    $$LocalCouponsTableCreateCompanionBuilder,
    $$LocalCouponsTableUpdateCompanionBuilder,
    (
      LocalCoupon,
      BaseReferences<_$AppDatabase, $LocalCouponsTable, LocalCoupon>
    ),
    LocalCoupon,
    PrefetchHooks Function()> {
  $$LocalCouponsTableTableManager(_$AppDatabase db, $LocalCouponsTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalCouponsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalCouponsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalCouponsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<int> id = const Value.absent(),
            Value<String> code = const Value.absent(),
            Value<String> type = const Value.absent(),
            Value<double> amount = const Value.absent(),
            Value<double> minimumAmount = const Value.absent(),
            Value<double?> quantity = const Value.absent(),
            Value<double> used = const Value.absent(),
            Value<String?> expiredDate = const Value.absent(),
            Value<String?> updatedAt = const Value.absent(),
          }) =>
              LocalCouponsCompanion(
            id: id,
            code: code,
            type: type,
            amount: amount,
            minimumAmount: minimumAmount,
            quantity: quantity,
            used: used,
            expiredDate: expiredDate,
            updatedAt: updatedAt,
          ),
          createCompanionCallback: ({
            Value<int> id = const Value.absent(),
            required String code,
            Value<String> type = const Value.absent(),
            Value<double> amount = const Value.absent(),
            Value<double> minimumAmount = const Value.absent(),
            Value<double?> quantity = const Value.absent(),
            Value<double> used = const Value.absent(),
            Value<String?> expiredDate = const Value.absent(),
            Value<String?> updatedAt = const Value.absent(),
          }) =>
              LocalCouponsCompanion.insert(
            id: id,
            code: code,
            type: type,
            amount: amount,
            minimumAmount: minimumAmount,
            quantity: quantity,
            used: used,
            expiredDate: expiredDate,
            updatedAt: updatedAt,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$LocalCouponsTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $LocalCouponsTable,
    LocalCoupon,
    $$LocalCouponsTableFilterComposer,
    $$LocalCouponsTableOrderingComposer,
    $$LocalCouponsTableAnnotationComposer,
    $$LocalCouponsTableCreateCompanionBuilder,
    $$LocalCouponsTableUpdateCompanionBuilder,
    (
      LocalCoupon,
      BaseReferences<_$AppDatabase, $LocalCouponsTable, LocalCoupon>
    ),
    LocalCoupon,
    PrefetchHooks Function()>;
typedef $$BillersTableCreateCompanionBuilder = BillersCompanion Function({
  Value<int> id,
  required String name,
  Value<String?> companyName,
  Value<String?> updatedAt,
});
typedef $$BillersTableUpdateCompanionBuilder = BillersCompanion Function({
  Value<int> id,
  Value<String> name,
  Value<String?> companyName,
  Value<String?> updatedAt,
});

class $$BillersTableFilterComposer
    extends Composer<_$AppDatabase, $BillersTable> {
  $$BillersTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get companyName => $composableBuilder(
      column: $table.companyName, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnFilters(column));
}

class $$BillersTableOrderingComposer
    extends Composer<_$AppDatabase, $BillersTable> {
  $$BillersTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get companyName => $composableBuilder(
      column: $table.companyName, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnOrderings(column));
}

class $$BillersTableAnnotationComposer
    extends Composer<_$AppDatabase, $BillersTable> {
  $$BillersTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  GeneratedColumn<String> get companyName => $composableBuilder(
      column: $table.companyName, builder: (column) => column);

  GeneratedColumn<String> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$BillersTableTableManager extends RootTableManager<
    _$AppDatabase,
    $BillersTable,
    Biller,
    $$BillersTableFilterComposer,
    $$BillersTableOrderingComposer,
    $$BillersTableAnnotationComposer,
    $$BillersTableCreateCompanionBuilder,
    $$BillersTableUpdateCompanionBuilder,
    (Biller, BaseReferences<_$AppDatabase, $BillersTable, Biller>),
    Biller,
    PrefetchHooks Function()> {
  $$BillersTableTableManager(_$AppDatabase db, $BillersTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$BillersTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$BillersTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$BillersTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<int> id = const Value.absent(),
            Value<String> name = const Value.absent(),
            Value<String?> companyName = const Value.absent(),
            Value<String?> updatedAt = const Value.absent(),
          }) =>
              BillersCompanion(
            id: id,
            name: name,
            companyName: companyName,
            updatedAt: updatedAt,
          ),
          createCompanionCallback: ({
            Value<int> id = const Value.absent(),
            required String name,
            Value<String?> companyName = const Value.absent(),
            Value<String?> updatedAt = const Value.absent(),
          }) =>
              BillersCompanion.insert(
            id: id,
            name: name,
            companyName: companyName,
            updatedAt: updatedAt,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$BillersTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $BillersTable,
    Biller,
    $$BillersTableFilterComposer,
    $$BillersTableOrderingComposer,
    $$BillersTableAnnotationComposer,
    $$BillersTableCreateCompanionBuilder,
    $$BillersTableUpdateCompanionBuilder,
    (Biller, BaseReferences<_$AppDatabase, $BillersTable, Biller>),
    Biller,
    PrefetchHooks Function()>;
typedef $$ProductsTableCreateCompanionBuilder = ProductsCompanion Function({
  Value<int> id,
  required String name,
  required String code,
  Value<String> type,
  Value<int?> brandId,
  Value<int?> categoryId,
  Value<int?> unitId,
  Value<int?> saleUnitId,
  Value<double> cost,
  Value<double> price,
  Value<double> wholesalePrice,
  Value<int?> taxId,
  Value<int> taxMethod,
  Value<String?> image,
  Value<bool> isVariant,
  Value<bool> isBatch,
  Value<bool> isImei,
  Value<bool> isEmbeded,
  Value<int> featured,
  Value<String?> updatedAt,
});
typedef $$ProductsTableUpdateCompanionBuilder = ProductsCompanion Function({
  Value<int> id,
  Value<String> name,
  Value<String> code,
  Value<String> type,
  Value<int?> brandId,
  Value<int?> categoryId,
  Value<int?> unitId,
  Value<int?> saleUnitId,
  Value<double> cost,
  Value<double> price,
  Value<double> wholesalePrice,
  Value<int?> taxId,
  Value<int> taxMethod,
  Value<String?> image,
  Value<bool> isVariant,
  Value<bool> isBatch,
  Value<bool> isImei,
  Value<bool> isEmbeded,
  Value<int> featured,
  Value<String?> updatedAt,
});

class $$ProductsTableFilterComposer
    extends Composer<_$AppDatabase, $ProductsTable> {
  $$ProductsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get code => $composableBuilder(
      column: $table.code, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get type => $composableBuilder(
      column: $table.type, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get brandId => $composableBuilder(
      column: $table.brandId, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get categoryId => $composableBuilder(
      column: $table.categoryId, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get unitId => $composableBuilder(
      column: $table.unitId, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get saleUnitId => $composableBuilder(
      column: $table.saleUnitId, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get cost => $composableBuilder(
      column: $table.cost, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get price => $composableBuilder(
      column: $table.price, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get wholesalePrice => $composableBuilder(
      column: $table.wholesalePrice,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get taxId => $composableBuilder(
      column: $table.taxId, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get taxMethod => $composableBuilder(
      column: $table.taxMethod, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get image => $composableBuilder(
      column: $table.image, builder: (column) => ColumnFilters(column));

  ColumnFilters<bool> get isVariant => $composableBuilder(
      column: $table.isVariant, builder: (column) => ColumnFilters(column));

  ColumnFilters<bool> get isBatch => $composableBuilder(
      column: $table.isBatch, builder: (column) => ColumnFilters(column));

  ColumnFilters<bool> get isImei => $composableBuilder(
      column: $table.isImei, builder: (column) => ColumnFilters(column));

  ColumnFilters<bool> get isEmbeded => $composableBuilder(
      column: $table.isEmbeded, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get featured => $composableBuilder(
      column: $table.featured, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnFilters(column));
}

class $$ProductsTableOrderingComposer
    extends Composer<_$AppDatabase, $ProductsTable> {
  $$ProductsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get code => $composableBuilder(
      column: $table.code, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get type => $composableBuilder(
      column: $table.type, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get brandId => $composableBuilder(
      column: $table.brandId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get categoryId => $composableBuilder(
      column: $table.categoryId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get unitId => $composableBuilder(
      column: $table.unitId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get saleUnitId => $composableBuilder(
      column: $table.saleUnitId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get cost => $composableBuilder(
      column: $table.cost, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get price => $composableBuilder(
      column: $table.price, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get wholesalePrice => $composableBuilder(
      column: $table.wholesalePrice,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get taxId => $composableBuilder(
      column: $table.taxId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get taxMethod => $composableBuilder(
      column: $table.taxMethod, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get image => $composableBuilder(
      column: $table.image, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<bool> get isVariant => $composableBuilder(
      column: $table.isVariant, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<bool> get isBatch => $composableBuilder(
      column: $table.isBatch, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<bool> get isImei => $composableBuilder(
      column: $table.isImei, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<bool> get isEmbeded => $composableBuilder(
      column: $table.isEmbeded, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get featured => $composableBuilder(
      column: $table.featured, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnOrderings(column));
}

class $$ProductsTableAnnotationComposer
    extends Composer<_$AppDatabase, $ProductsTable> {
  $$ProductsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  GeneratedColumn<String> get code =>
      $composableBuilder(column: $table.code, builder: (column) => column);

  GeneratedColumn<String> get type =>
      $composableBuilder(column: $table.type, builder: (column) => column);

  GeneratedColumn<int> get brandId =>
      $composableBuilder(column: $table.brandId, builder: (column) => column);

  GeneratedColumn<int> get categoryId => $composableBuilder(
      column: $table.categoryId, builder: (column) => column);

  GeneratedColumn<int> get unitId =>
      $composableBuilder(column: $table.unitId, builder: (column) => column);

  GeneratedColumn<int> get saleUnitId => $composableBuilder(
      column: $table.saleUnitId, builder: (column) => column);

  GeneratedColumn<double> get cost =>
      $composableBuilder(column: $table.cost, builder: (column) => column);

  GeneratedColumn<double> get price =>
      $composableBuilder(column: $table.price, builder: (column) => column);

  GeneratedColumn<double> get wholesalePrice => $composableBuilder(
      column: $table.wholesalePrice, builder: (column) => column);

  GeneratedColumn<int> get taxId =>
      $composableBuilder(column: $table.taxId, builder: (column) => column);

  GeneratedColumn<int> get taxMethod =>
      $composableBuilder(column: $table.taxMethod, builder: (column) => column);

  GeneratedColumn<String> get image =>
      $composableBuilder(column: $table.image, builder: (column) => column);

  GeneratedColumn<bool> get isVariant =>
      $composableBuilder(column: $table.isVariant, builder: (column) => column);

  GeneratedColumn<bool> get isBatch =>
      $composableBuilder(column: $table.isBatch, builder: (column) => column);

  GeneratedColumn<bool> get isImei =>
      $composableBuilder(column: $table.isImei, builder: (column) => column);

  GeneratedColumn<bool> get isEmbeded =>
      $composableBuilder(column: $table.isEmbeded, builder: (column) => column);

  GeneratedColumn<int> get featured =>
      $composableBuilder(column: $table.featured, builder: (column) => column);

  GeneratedColumn<String> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$ProductsTableTableManager extends RootTableManager<
    _$AppDatabase,
    $ProductsTable,
    Product,
    $$ProductsTableFilterComposer,
    $$ProductsTableOrderingComposer,
    $$ProductsTableAnnotationComposer,
    $$ProductsTableCreateCompanionBuilder,
    $$ProductsTableUpdateCompanionBuilder,
    (Product, BaseReferences<_$AppDatabase, $ProductsTable, Product>),
    Product,
    PrefetchHooks Function()> {
  $$ProductsTableTableManager(_$AppDatabase db, $ProductsTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$ProductsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$ProductsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$ProductsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<int> id = const Value.absent(),
            Value<String> name = const Value.absent(),
            Value<String> code = const Value.absent(),
            Value<String> type = const Value.absent(),
            Value<int?> brandId = const Value.absent(),
            Value<int?> categoryId = const Value.absent(),
            Value<int?> unitId = const Value.absent(),
            Value<int?> saleUnitId = const Value.absent(),
            Value<double> cost = const Value.absent(),
            Value<double> price = const Value.absent(),
            Value<double> wholesalePrice = const Value.absent(),
            Value<int?> taxId = const Value.absent(),
            Value<int> taxMethod = const Value.absent(),
            Value<String?> image = const Value.absent(),
            Value<bool> isVariant = const Value.absent(),
            Value<bool> isBatch = const Value.absent(),
            Value<bool> isImei = const Value.absent(),
            Value<bool> isEmbeded = const Value.absent(),
            Value<int> featured = const Value.absent(),
            Value<String?> updatedAt = const Value.absent(),
          }) =>
              ProductsCompanion(
            id: id,
            name: name,
            code: code,
            type: type,
            brandId: brandId,
            categoryId: categoryId,
            unitId: unitId,
            saleUnitId: saleUnitId,
            cost: cost,
            price: price,
            wholesalePrice: wholesalePrice,
            taxId: taxId,
            taxMethod: taxMethod,
            image: image,
            isVariant: isVariant,
            isBatch: isBatch,
            isImei: isImei,
            isEmbeded: isEmbeded,
            featured: featured,
            updatedAt: updatedAt,
          ),
          createCompanionCallback: ({
            Value<int> id = const Value.absent(),
            required String name,
            required String code,
            Value<String> type = const Value.absent(),
            Value<int?> brandId = const Value.absent(),
            Value<int?> categoryId = const Value.absent(),
            Value<int?> unitId = const Value.absent(),
            Value<int?> saleUnitId = const Value.absent(),
            Value<double> cost = const Value.absent(),
            Value<double> price = const Value.absent(),
            Value<double> wholesalePrice = const Value.absent(),
            Value<int?> taxId = const Value.absent(),
            Value<int> taxMethod = const Value.absent(),
            Value<String?> image = const Value.absent(),
            Value<bool> isVariant = const Value.absent(),
            Value<bool> isBatch = const Value.absent(),
            Value<bool> isImei = const Value.absent(),
            Value<bool> isEmbeded = const Value.absent(),
            Value<int> featured = const Value.absent(),
            Value<String?> updatedAt = const Value.absent(),
          }) =>
              ProductsCompanion.insert(
            id: id,
            name: name,
            code: code,
            type: type,
            brandId: brandId,
            categoryId: categoryId,
            unitId: unitId,
            saleUnitId: saleUnitId,
            cost: cost,
            price: price,
            wholesalePrice: wholesalePrice,
            taxId: taxId,
            taxMethod: taxMethod,
            image: image,
            isVariant: isVariant,
            isBatch: isBatch,
            isImei: isImei,
            isEmbeded: isEmbeded,
            featured: featured,
            updatedAt: updatedAt,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$ProductsTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $ProductsTable,
    Product,
    $$ProductsTableFilterComposer,
    $$ProductsTableOrderingComposer,
    $$ProductsTableAnnotationComposer,
    $$ProductsTableCreateCompanionBuilder,
    $$ProductsTableUpdateCompanionBuilder,
    (Product, BaseReferences<_$AppDatabase, $ProductsTable, Product>),
    Product,
    PrefetchHooks Function()>;
typedef $$ProductVariantsTableCreateCompanionBuilder = ProductVariantsCompanion
    Function({
  Value<int> id,
  required int productId,
  Value<int?> variantId,
  required String itemCode,
  Value<double> additionalPrice,
  Value<String?> updatedAt,
});
typedef $$ProductVariantsTableUpdateCompanionBuilder = ProductVariantsCompanion
    Function({
  Value<int> id,
  Value<int> productId,
  Value<int?> variantId,
  Value<String> itemCode,
  Value<double> additionalPrice,
  Value<String?> updatedAt,
});

class $$ProductVariantsTableFilterComposer
    extends Composer<_$AppDatabase, $ProductVariantsTable> {
  $$ProductVariantsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get productId => $composableBuilder(
      column: $table.productId, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get variantId => $composableBuilder(
      column: $table.variantId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get itemCode => $composableBuilder(
      column: $table.itemCode, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get additionalPrice => $composableBuilder(
      column: $table.additionalPrice,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnFilters(column));
}

class $$ProductVariantsTableOrderingComposer
    extends Composer<_$AppDatabase, $ProductVariantsTable> {
  $$ProductVariantsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get productId => $composableBuilder(
      column: $table.productId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get variantId => $composableBuilder(
      column: $table.variantId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get itemCode => $composableBuilder(
      column: $table.itemCode, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get additionalPrice => $composableBuilder(
      column: $table.additionalPrice,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnOrderings(column));
}

class $$ProductVariantsTableAnnotationComposer
    extends Composer<_$AppDatabase, $ProductVariantsTable> {
  $$ProductVariantsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<int> get productId =>
      $composableBuilder(column: $table.productId, builder: (column) => column);

  GeneratedColumn<int> get variantId =>
      $composableBuilder(column: $table.variantId, builder: (column) => column);

  GeneratedColumn<String> get itemCode =>
      $composableBuilder(column: $table.itemCode, builder: (column) => column);

  GeneratedColumn<double> get additionalPrice => $composableBuilder(
      column: $table.additionalPrice, builder: (column) => column);

  GeneratedColumn<String> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$ProductVariantsTableTableManager extends RootTableManager<
    _$AppDatabase,
    $ProductVariantsTable,
    ProductVariant,
    $$ProductVariantsTableFilterComposer,
    $$ProductVariantsTableOrderingComposer,
    $$ProductVariantsTableAnnotationComposer,
    $$ProductVariantsTableCreateCompanionBuilder,
    $$ProductVariantsTableUpdateCompanionBuilder,
    (
      ProductVariant,
      BaseReferences<_$AppDatabase, $ProductVariantsTable, ProductVariant>
    ),
    ProductVariant,
    PrefetchHooks Function()> {
  $$ProductVariantsTableTableManager(
      _$AppDatabase db, $ProductVariantsTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$ProductVariantsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$ProductVariantsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$ProductVariantsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<int> id = const Value.absent(),
            Value<int> productId = const Value.absent(),
            Value<int?> variantId = const Value.absent(),
            Value<String> itemCode = const Value.absent(),
            Value<double> additionalPrice = const Value.absent(),
            Value<String?> updatedAt = const Value.absent(),
          }) =>
              ProductVariantsCompanion(
            id: id,
            productId: productId,
            variantId: variantId,
            itemCode: itemCode,
            additionalPrice: additionalPrice,
            updatedAt: updatedAt,
          ),
          createCompanionCallback: ({
            Value<int> id = const Value.absent(),
            required int productId,
            Value<int?> variantId = const Value.absent(),
            required String itemCode,
            Value<double> additionalPrice = const Value.absent(),
            Value<String?> updatedAt = const Value.absent(),
          }) =>
              ProductVariantsCompanion.insert(
            id: id,
            productId: productId,
            variantId: variantId,
            itemCode: itemCode,
            additionalPrice: additionalPrice,
            updatedAt: updatedAt,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$ProductVariantsTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $ProductVariantsTable,
    ProductVariant,
    $$ProductVariantsTableFilterComposer,
    $$ProductVariantsTableOrderingComposer,
    $$ProductVariantsTableAnnotationComposer,
    $$ProductVariantsTableCreateCompanionBuilder,
    $$ProductVariantsTableUpdateCompanionBuilder,
    (
      ProductVariant,
      BaseReferences<_$AppDatabase, $ProductVariantsTable, ProductVariant>
    ),
    ProductVariant,
    PrefetchHooks Function()>;
typedef $$ProductStockTableCreateCompanionBuilder = ProductStockCompanion
    Function({
  Value<int> id,
  required int productId,
  required int warehouseId,
  Value<int?> variantId,
  Value<double> qty,
  Value<double?> price,
  Value<int?> productBatchId,
  Value<String?> imeiNumber,
  Value<String?> updatedAt,
});
typedef $$ProductStockTableUpdateCompanionBuilder = ProductStockCompanion
    Function({
  Value<int> id,
  Value<int> productId,
  Value<int> warehouseId,
  Value<int?> variantId,
  Value<double> qty,
  Value<double?> price,
  Value<int?> productBatchId,
  Value<String?> imeiNumber,
  Value<String?> updatedAt,
});

class $$ProductStockTableFilterComposer
    extends Composer<_$AppDatabase, $ProductStockTable> {
  $$ProductStockTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get productId => $composableBuilder(
      column: $table.productId, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get warehouseId => $composableBuilder(
      column: $table.warehouseId, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get variantId => $composableBuilder(
      column: $table.variantId, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get qty => $composableBuilder(
      column: $table.qty, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get price => $composableBuilder(
      column: $table.price, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get productBatchId => $composableBuilder(
      column: $table.productBatchId,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get imeiNumber => $composableBuilder(
      column: $table.imeiNumber, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnFilters(column));
}

class $$ProductStockTableOrderingComposer
    extends Composer<_$AppDatabase, $ProductStockTable> {
  $$ProductStockTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get productId => $composableBuilder(
      column: $table.productId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get warehouseId => $composableBuilder(
      column: $table.warehouseId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get variantId => $composableBuilder(
      column: $table.variantId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get qty => $composableBuilder(
      column: $table.qty, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get price => $composableBuilder(
      column: $table.price, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get productBatchId => $composableBuilder(
      column: $table.productBatchId,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get imeiNumber => $composableBuilder(
      column: $table.imeiNumber, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnOrderings(column));
}

class $$ProductStockTableAnnotationComposer
    extends Composer<_$AppDatabase, $ProductStockTable> {
  $$ProductStockTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<int> get productId =>
      $composableBuilder(column: $table.productId, builder: (column) => column);

  GeneratedColumn<int> get warehouseId => $composableBuilder(
      column: $table.warehouseId, builder: (column) => column);

  GeneratedColumn<int> get variantId =>
      $composableBuilder(column: $table.variantId, builder: (column) => column);

  GeneratedColumn<double> get qty =>
      $composableBuilder(column: $table.qty, builder: (column) => column);

  GeneratedColumn<double> get price =>
      $composableBuilder(column: $table.price, builder: (column) => column);

  GeneratedColumn<int> get productBatchId => $composableBuilder(
      column: $table.productBatchId, builder: (column) => column);

  GeneratedColumn<String> get imeiNumber => $composableBuilder(
      column: $table.imeiNumber, builder: (column) => column);

  GeneratedColumn<String> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$ProductStockTableTableManager extends RootTableManager<
    _$AppDatabase,
    $ProductStockTable,
    ProductStockData,
    $$ProductStockTableFilterComposer,
    $$ProductStockTableOrderingComposer,
    $$ProductStockTableAnnotationComposer,
    $$ProductStockTableCreateCompanionBuilder,
    $$ProductStockTableUpdateCompanionBuilder,
    (
      ProductStockData,
      BaseReferences<_$AppDatabase, $ProductStockTable, ProductStockData>
    ),
    ProductStockData,
    PrefetchHooks Function()> {
  $$ProductStockTableTableManager(_$AppDatabase db, $ProductStockTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$ProductStockTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$ProductStockTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$ProductStockTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<int> id = const Value.absent(),
            Value<int> productId = const Value.absent(),
            Value<int> warehouseId = const Value.absent(),
            Value<int?> variantId = const Value.absent(),
            Value<double> qty = const Value.absent(),
            Value<double?> price = const Value.absent(),
            Value<int?> productBatchId = const Value.absent(),
            Value<String?> imeiNumber = const Value.absent(),
            Value<String?> updatedAt = const Value.absent(),
          }) =>
              ProductStockCompanion(
            id: id,
            productId: productId,
            warehouseId: warehouseId,
            variantId: variantId,
            qty: qty,
            price: price,
            productBatchId: productBatchId,
            imeiNumber: imeiNumber,
            updatedAt: updatedAt,
          ),
          createCompanionCallback: ({
            Value<int> id = const Value.absent(),
            required int productId,
            required int warehouseId,
            Value<int?> variantId = const Value.absent(),
            Value<double> qty = const Value.absent(),
            Value<double?> price = const Value.absent(),
            Value<int?> productBatchId = const Value.absent(),
            Value<String?> imeiNumber = const Value.absent(),
            Value<String?> updatedAt = const Value.absent(),
          }) =>
              ProductStockCompanion.insert(
            id: id,
            productId: productId,
            warehouseId: warehouseId,
            variantId: variantId,
            qty: qty,
            price: price,
            productBatchId: productBatchId,
            imeiNumber: imeiNumber,
            updatedAt: updatedAt,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$ProductStockTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $ProductStockTable,
    ProductStockData,
    $$ProductStockTableFilterComposer,
    $$ProductStockTableOrderingComposer,
    $$ProductStockTableAnnotationComposer,
    $$ProductStockTableCreateCompanionBuilder,
    $$ProductStockTableUpdateCompanionBuilder,
    (
      ProductStockData,
      BaseReferences<_$AppDatabase, $ProductStockTable, ProductStockData>
    ),
    ProductStockData,
    PrefetchHooks Function()>;
typedef $$LocalSalesTableCreateCompanionBuilder = LocalSalesCompanion Function({
  Value<int> id,
  required String clientUuid,
  required int warehouseId,
  required int customerId,
  Value<int?> billerId,
  Value<String?> referenceNo,
  Value<int> itemCount,
  Value<double> totalQty,
  Value<double> totalDiscount,
  Value<double> totalTax,
  required double grandTotal,
  Value<double> paidAmount,
  Value<int> saleStatus,
  Value<int> paymentStatus,
  Value<double> orderTaxRate,
  Value<double> orderDiscount,
  Value<double> shippingCost,
  Value<int?> couponId,
  Value<bool> couponActive,
  Value<String?> payloadJson,
  Value<String> syncStatus,
  Value<int?> serverSaleId,
  Value<String?> serverReferenceNo,
  Value<String?> errorMessage,
  Value<DateTime> createdAt,
  Value<DateTime?> syncedAt,
});
typedef $$LocalSalesTableUpdateCompanionBuilder = LocalSalesCompanion Function({
  Value<int> id,
  Value<String> clientUuid,
  Value<int> warehouseId,
  Value<int> customerId,
  Value<int?> billerId,
  Value<String?> referenceNo,
  Value<int> itemCount,
  Value<double> totalQty,
  Value<double> totalDiscount,
  Value<double> totalTax,
  Value<double> grandTotal,
  Value<double> paidAmount,
  Value<int> saleStatus,
  Value<int> paymentStatus,
  Value<double> orderTaxRate,
  Value<double> orderDiscount,
  Value<double> shippingCost,
  Value<int?> couponId,
  Value<bool> couponActive,
  Value<String?> payloadJson,
  Value<String> syncStatus,
  Value<int?> serverSaleId,
  Value<String?> serverReferenceNo,
  Value<String?> errorMessage,
  Value<DateTime> createdAt,
  Value<DateTime?> syncedAt,
});

final class $$LocalSalesTableReferences
    extends BaseReferences<_$AppDatabase, $LocalSalesTable, LocalSale> {
  $$LocalSalesTableReferences(super.$_db, super.$_table, super.$_typedResult);

  static MultiTypedResultKey<$LocalSaleLinesTable, List<LocalSaleLine>>
      _localSaleLinesRefsTable(_$AppDatabase db) =>
          MultiTypedResultKey.fromTable(db.localSaleLines,
              aliasName: $_aliasNameGenerator(
                  db.localSales.id, db.localSaleLines.localSaleId));

  $$LocalSaleLinesTableProcessedTableManager get localSaleLinesRefs {
    final manager = $$LocalSaleLinesTableTableManager($_db, $_db.localSaleLines)
        .filter((f) => f.localSaleId.id.sqlEquals($_itemColumn<int>('id')!));

    final cache = $_typedResult.readTableOrNull(_localSaleLinesRefsTable($_db));
    return ProcessedTableManager(
        manager.$state.copyWith(prefetchedData: cache));
  }
}

class $$LocalSalesTableFilterComposer
    extends Composer<_$AppDatabase, $LocalSalesTable> {
  $$LocalSalesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get clientUuid => $composableBuilder(
      column: $table.clientUuid, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get warehouseId => $composableBuilder(
      column: $table.warehouseId, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get customerId => $composableBuilder(
      column: $table.customerId, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get billerId => $composableBuilder(
      column: $table.billerId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get referenceNo => $composableBuilder(
      column: $table.referenceNo, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get itemCount => $composableBuilder(
      column: $table.itemCount, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get totalQty => $composableBuilder(
      column: $table.totalQty, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get totalDiscount => $composableBuilder(
      column: $table.totalDiscount, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get totalTax => $composableBuilder(
      column: $table.totalTax, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get grandTotal => $composableBuilder(
      column: $table.grandTotal, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get paidAmount => $composableBuilder(
      column: $table.paidAmount, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get saleStatus => $composableBuilder(
      column: $table.saleStatus, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get paymentStatus => $composableBuilder(
      column: $table.paymentStatus, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get orderTaxRate => $composableBuilder(
      column: $table.orderTaxRate, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get orderDiscount => $composableBuilder(
      column: $table.orderDiscount, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get shippingCost => $composableBuilder(
      column: $table.shippingCost, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get couponId => $composableBuilder(
      column: $table.couponId, builder: (column) => ColumnFilters(column));

  ColumnFilters<bool> get couponActive => $composableBuilder(
      column: $table.couponActive, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get payloadJson => $composableBuilder(
      column: $table.payloadJson, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get syncStatus => $composableBuilder(
      column: $table.syncStatus, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get serverSaleId => $composableBuilder(
      column: $table.serverSaleId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get serverReferenceNo => $composableBuilder(
      column: $table.serverReferenceNo,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get errorMessage => $composableBuilder(
      column: $table.errorMessage, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get syncedAt => $composableBuilder(
      column: $table.syncedAt, builder: (column) => ColumnFilters(column));

  Expression<bool> localSaleLinesRefs(
      Expression<bool> Function($$LocalSaleLinesTableFilterComposer f) f) {
    final $$LocalSaleLinesTableFilterComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.id,
        referencedTable: $db.localSaleLines,
        getReferencedColumn: (t) => t.localSaleId,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            $$LocalSaleLinesTableFilterComposer(
              $db: $db,
              $table: $db.localSaleLines,
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return f(composer);
  }
}

class $$LocalSalesTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalSalesTable> {
  $$LocalSalesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get clientUuid => $composableBuilder(
      column: $table.clientUuid, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get warehouseId => $composableBuilder(
      column: $table.warehouseId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get customerId => $composableBuilder(
      column: $table.customerId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get billerId => $composableBuilder(
      column: $table.billerId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get referenceNo => $composableBuilder(
      column: $table.referenceNo, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get itemCount => $composableBuilder(
      column: $table.itemCount, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get totalQty => $composableBuilder(
      column: $table.totalQty, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get totalDiscount => $composableBuilder(
      column: $table.totalDiscount,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get totalTax => $composableBuilder(
      column: $table.totalTax, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get grandTotal => $composableBuilder(
      column: $table.grandTotal, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get paidAmount => $composableBuilder(
      column: $table.paidAmount, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get saleStatus => $composableBuilder(
      column: $table.saleStatus, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get paymentStatus => $composableBuilder(
      column: $table.paymentStatus,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get orderTaxRate => $composableBuilder(
      column: $table.orderTaxRate,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get orderDiscount => $composableBuilder(
      column: $table.orderDiscount,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get shippingCost => $composableBuilder(
      column: $table.shippingCost,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get couponId => $composableBuilder(
      column: $table.couponId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<bool> get couponActive => $composableBuilder(
      column: $table.couponActive,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get payloadJson => $composableBuilder(
      column: $table.payloadJson, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get syncStatus => $composableBuilder(
      column: $table.syncStatus, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get serverSaleId => $composableBuilder(
      column: $table.serverSaleId,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get serverReferenceNo => $composableBuilder(
      column: $table.serverReferenceNo,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get errorMessage => $composableBuilder(
      column: $table.errorMessage,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get syncedAt => $composableBuilder(
      column: $table.syncedAt, builder: (column) => ColumnOrderings(column));
}

class $$LocalSalesTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalSalesTable> {
  $$LocalSalesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get clientUuid => $composableBuilder(
      column: $table.clientUuid, builder: (column) => column);

  GeneratedColumn<int> get warehouseId => $composableBuilder(
      column: $table.warehouseId, builder: (column) => column);

  GeneratedColumn<int> get customerId => $composableBuilder(
      column: $table.customerId, builder: (column) => column);

  GeneratedColumn<int> get billerId =>
      $composableBuilder(column: $table.billerId, builder: (column) => column);

  GeneratedColumn<String> get referenceNo => $composableBuilder(
      column: $table.referenceNo, builder: (column) => column);

  GeneratedColumn<int> get itemCount =>
      $composableBuilder(column: $table.itemCount, builder: (column) => column);

  GeneratedColumn<double> get totalQty =>
      $composableBuilder(column: $table.totalQty, builder: (column) => column);

  GeneratedColumn<double> get totalDiscount => $composableBuilder(
      column: $table.totalDiscount, builder: (column) => column);

  GeneratedColumn<double> get totalTax =>
      $composableBuilder(column: $table.totalTax, builder: (column) => column);

  GeneratedColumn<double> get grandTotal => $composableBuilder(
      column: $table.grandTotal, builder: (column) => column);

  GeneratedColumn<double> get paidAmount => $composableBuilder(
      column: $table.paidAmount, builder: (column) => column);

  GeneratedColumn<int> get saleStatus => $composableBuilder(
      column: $table.saleStatus, builder: (column) => column);

  GeneratedColumn<int> get paymentStatus => $composableBuilder(
      column: $table.paymentStatus, builder: (column) => column);

  GeneratedColumn<double> get orderTaxRate => $composableBuilder(
      column: $table.orderTaxRate, builder: (column) => column);

  GeneratedColumn<double> get orderDiscount => $composableBuilder(
      column: $table.orderDiscount, builder: (column) => column);

  GeneratedColumn<double> get shippingCost => $composableBuilder(
      column: $table.shippingCost, builder: (column) => column);

  GeneratedColumn<int> get couponId =>
      $composableBuilder(column: $table.couponId, builder: (column) => column);

  GeneratedColumn<bool> get couponActive => $composableBuilder(
      column: $table.couponActive, builder: (column) => column);

  GeneratedColumn<String> get payloadJson => $composableBuilder(
      column: $table.payloadJson, builder: (column) => column);

  GeneratedColumn<String> get syncStatus => $composableBuilder(
      column: $table.syncStatus, builder: (column) => column);

  GeneratedColumn<int> get serverSaleId => $composableBuilder(
      column: $table.serverSaleId, builder: (column) => column);

  GeneratedColumn<String> get serverReferenceNo => $composableBuilder(
      column: $table.serverReferenceNo, builder: (column) => column);

  GeneratedColumn<String> get errorMessage => $composableBuilder(
      column: $table.errorMessage, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<DateTime> get syncedAt =>
      $composableBuilder(column: $table.syncedAt, builder: (column) => column);

  Expression<T> localSaleLinesRefs<T extends Object>(
      Expression<T> Function($$LocalSaleLinesTableAnnotationComposer a) f) {
    final $$LocalSaleLinesTableAnnotationComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.id,
        referencedTable: $db.localSaleLines,
        getReferencedColumn: (t) => t.localSaleId,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            $$LocalSaleLinesTableAnnotationComposer(
              $db: $db,
              $table: $db.localSaleLines,
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return f(composer);
  }
}

class $$LocalSalesTableTableManager extends RootTableManager<
    _$AppDatabase,
    $LocalSalesTable,
    LocalSale,
    $$LocalSalesTableFilterComposer,
    $$LocalSalesTableOrderingComposer,
    $$LocalSalesTableAnnotationComposer,
    $$LocalSalesTableCreateCompanionBuilder,
    $$LocalSalesTableUpdateCompanionBuilder,
    (LocalSale, $$LocalSalesTableReferences),
    LocalSale,
    PrefetchHooks Function({bool localSaleLinesRefs})> {
  $$LocalSalesTableTableManager(_$AppDatabase db, $LocalSalesTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalSalesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalSalesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalSalesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<int> id = const Value.absent(),
            Value<String> clientUuid = const Value.absent(),
            Value<int> warehouseId = const Value.absent(),
            Value<int> customerId = const Value.absent(),
            Value<int?> billerId = const Value.absent(),
            Value<String?> referenceNo = const Value.absent(),
            Value<int> itemCount = const Value.absent(),
            Value<double> totalQty = const Value.absent(),
            Value<double> totalDiscount = const Value.absent(),
            Value<double> totalTax = const Value.absent(),
            Value<double> grandTotal = const Value.absent(),
            Value<double> paidAmount = const Value.absent(),
            Value<int> saleStatus = const Value.absent(),
            Value<int> paymentStatus = const Value.absent(),
            Value<double> orderTaxRate = const Value.absent(),
            Value<double> orderDiscount = const Value.absent(),
            Value<double> shippingCost = const Value.absent(),
            Value<int?> couponId = const Value.absent(),
            Value<bool> couponActive = const Value.absent(),
            Value<String?> payloadJson = const Value.absent(),
            Value<String> syncStatus = const Value.absent(),
            Value<int?> serverSaleId = const Value.absent(),
            Value<String?> serverReferenceNo = const Value.absent(),
            Value<String?> errorMessage = const Value.absent(),
            Value<DateTime> createdAt = const Value.absent(),
            Value<DateTime?> syncedAt = const Value.absent(),
          }) =>
              LocalSalesCompanion(
            id: id,
            clientUuid: clientUuid,
            warehouseId: warehouseId,
            customerId: customerId,
            billerId: billerId,
            referenceNo: referenceNo,
            itemCount: itemCount,
            totalQty: totalQty,
            totalDiscount: totalDiscount,
            totalTax: totalTax,
            grandTotal: grandTotal,
            paidAmount: paidAmount,
            saleStatus: saleStatus,
            paymentStatus: paymentStatus,
            orderTaxRate: orderTaxRate,
            orderDiscount: orderDiscount,
            shippingCost: shippingCost,
            couponId: couponId,
            couponActive: couponActive,
            payloadJson: payloadJson,
            syncStatus: syncStatus,
            serverSaleId: serverSaleId,
            serverReferenceNo: serverReferenceNo,
            errorMessage: errorMessage,
            createdAt: createdAt,
            syncedAt: syncedAt,
          ),
          createCompanionCallback: ({
            Value<int> id = const Value.absent(),
            required String clientUuid,
            required int warehouseId,
            required int customerId,
            Value<int?> billerId = const Value.absent(),
            Value<String?> referenceNo = const Value.absent(),
            Value<int> itemCount = const Value.absent(),
            Value<double> totalQty = const Value.absent(),
            Value<double> totalDiscount = const Value.absent(),
            Value<double> totalTax = const Value.absent(),
            required double grandTotal,
            Value<double> paidAmount = const Value.absent(),
            Value<int> saleStatus = const Value.absent(),
            Value<int> paymentStatus = const Value.absent(),
            Value<double> orderTaxRate = const Value.absent(),
            Value<double> orderDiscount = const Value.absent(),
            Value<double> shippingCost = const Value.absent(),
            Value<int?> couponId = const Value.absent(),
            Value<bool> couponActive = const Value.absent(),
            Value<String?> payloadJson = const Value.absent(),
            Value<String> syncStatus = const Value.absent(),
            Value<int?> serverSaleId = const Value.absent(),
            Value<String?> serverReferenceNo = const Value.absent(),
            Value<String?> errorMessage = const Value.absent(),
            Value<DateTime> createdAt = const Value.absent(),
            Value<DateTime?> syncedAt = const Value.absent(),
          }) =>
              LocalSalesCompanion.insert(
            id: id,
            clientUuid: clientUuid,
            warehouseId: warehouseId,
            customerId: customerId,
            billerId: billerId,
            referenceNo: referenceNo,
            itemCount: itemCount,
            totalQty: totalQty,
            totalDiscount: totalDiscount,
            totalTax: totalTax,
            grandTotal: grandTotal,
            paidAmount: paidAmount,
            saleStatus: saleStatus,
            paymentStatus: paymentStatus,
            orderTaxRate: orderTaxRate,
            orderDiscount: orderDiscount,
            shippingCost: shippingCost,
            couponId: couponId,
            couponActive: couponActive,
            payloadJson: payloadJson,
            syncStatus: syncStatus,
            serverSaleId: serverSaleId,
            serverReferenceNo: serverReferenceNo,
            errorMessage: errorMessage,
            createdAt: createdAt,
            syncedAt: syncedAt,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (
                    e.readTable(table),
                    $$LocalSalesTableReferences(db, table, e)
                  ))
              .toList(),
          prefetchHooksCallback: ({localSaleLinesRefs = false}) {
            return PrefetchHooks(
              db: db,
              explicitlyWatchedTables: [
                if (localSaleLinesRefs) db.localSaleLines
              ],
              addJoins: null,
              getPrefetchedDataCallback: (items) async {
                return [
                  if (localSaleLinesRefs)
                    await $_getPrefetchedData<LocalSale, $LocalSalesTable,
                            LocalSaleLine>(
                        currentTable: table,
                        referencedTable: $$LocalSalesTableReferences
                            ._localSaleLinesRefsTable(db),
                        managerFromTypedResult: (p0) =>
                            $$LocalSalesTableReferences(db, table, p0)
                                .localSaleLinesRefs,
                        referencedItemsForCurrentItem:
                            (item, referencedItems) => referencedItems
                                .where((e) => e.localSaleId == item.id),
                        typedResults: items)
                ];
              },
            );
          },
        ));
}

typedef $$LocalSalesTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $LocalSalesTable,
    LocalSale,
    $$LocalSalesTableFilterComposer,
    $$LocalSalesTableOrderingComposer,
    $$LocalSalesTableAnnotationComposer,
    $$LocalSalesTableCreateCompanionBuilder,
    $$LocalSalesTableUpdateCompanionBuilder,
    (LocalSale, $$LocalSalesTableReferences),
    LocalSale,
    PrefetchHooks Function({bool localSaleLinesRefs})>;
typedef $$LocalSaleLinesTableCreateCompanionBuilder = LocalSaleLinesCompanion
    Function({
  Value<int> id,
  required int localSaleId,
  required int productId,
  Value<int?> variantId,
  Value<int?> productBatchId,
  Value<String?> code,
  Value<String?> name,
  required double qty,
  required double netUnitPrice,
  Value<double> discount,
  Value<double> taxRate,
  Value<double> tax,
  required double total,
  Value<String> saleUnit,
  Value<String?> imeiNumber,
});
typedef $$LocalSaleLinesTableUpdateCompanionBuilder = LocalSaleLinesCompanion
    Function({
  Value<int> id,
  Value<int> localSaleId,
  Value<int> productId,
  Value<int?> variantId,
  Value<int?> productBatchId,
  Value<String?> code,
  Value<String?> name,
  Value<double> qty,
  Value<double> netUnitPrice,
  Value<double> discount,
  Value<double> taxRate,
  Value<double> tax,
  Value<double> total,
  Value<String> saleUnit,
  Value<String?> imeiNumber,
});

final class $$LocalSaleLinesTableReferences
    extends BaseReferences<_$AppDatabase, $LocalSaleLinesTable, LocalSaleLine> {
  $$LocalSaleLinesTableReferences(
      super.$_db, super.$_table, super.$_typedResult);

  static $LocalSalesTable _localSaleIdTable(_$AppDatabase db) =>
      db.localSales.createAlias($_aliasNameGenerator(
          db.localSaleLines.localSaleId, db.localSales.id));

  $$LocalSalesTableProcessedTableManager get localSaleId {
    final $_column = $_itemColumn<int>('local_sale_id')!;

    final manager = $$LocalSalesTableTableManager($_db, $_db.localSales)
        .filter((f) => f.id.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_localSaleIdTable($_db));
    if (item == null) return manager;
    return ProcessedTableManager(
        manager.$state.copyWith(prefetchedData: [item]));
  }
}

class $$LocalSaleLinesTableFilterComposer
    extends Composer<_$AppDatabase, $LocalSaleLinesTable> {
  $$LocalSaleLinesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get productId => $composableBuilder(
      column: $table.productId, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get variantId => $composableBuilder(
      column: $table.variantId, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get productBatchId => $composableBuilder(
      column: $table.productBatchId,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get code => $composableBuilder(
      column: $table.code, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get qty => $composableBuilder(
      column: $table.qty, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get netUnitPrice => $composableBuilder(
      column: $table.netUnitPrice, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get discount => $composableBuilder(
      column: $table.discount, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get taxRate => $composableBuilder(
      column: $table.taxRate, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get tax => $composableBuilder(
      column: $table.tax, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get total => $composableBuilder(
      column: $table.total, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get saleUnit => $composableBuilder(
      column: $table.saleUnit, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get imeiNumber => $composableBuilder(
      column: $table.imeiNumber, builder: (column) => ColumnFilters(column));

  $$LocalSalesTableFilterComposer get localSaleId {
    final $$LocalSalesTableFilterComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.localSaleId,
        referencedTable: $db.localSales,
        getReferencedColumn: (t) => t.id,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            $$LocalSalesTableFilterComposer(
              $db: $db,
              $table: $db.localSales,
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return composer;
  }
}

class $$LocalSaleLinesTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalSaleLinesTable> {
  $$LocalSaleLinesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get productId => $composableBuilder(
      column: $table.productId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get variantId => $composableBuilder(
      column: $table.variantId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get productBatchId => $composableBuilder(
      column: $table.productBatchId,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get code => $composableBuilder(
      column: $table.code, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get qty => $composableBuilder(
      column: $table.qty, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get netUnitPrice => $composableBuilder(
      column: $table.netUnitPrice,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get discount => $composableBuilder(
      column: $table.discount, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get taxRate => $composableBuilder(
      column: $table.taxRate, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get tax => $composableBuilder(
      column: $table.tax, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get total => $composableBuilder(
      column: $table.total, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get saleUnit => $composableBuilder(
      column: $table.saleUnit, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get imeiNumber => $composableBuilder(
      column: $table.imeiNumber, builder: (column) => ColumnOrderings(column));

  $$LocalSalesTableOrderingComposer get localSaleId {
    final $$LocalSalesTableOrderingComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.localSaleId,
        referencedTable: $db.localSales,
        getReferencedColumn: (t) => t.id,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            $$LocalSalesTableOrderingComposer(
              $db: $db,
              $table: $db.localSales,
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return composer;
  }
}

class $$LocalSaleLinesTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalSaleLinesTable> {
  $$LocalSaleLinesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<int> get productId =>
      $composableBuilder(column: $table.productId, builder: (column) => column);

  GeneratedColumn<int> get variantId =>
      $composableBuilder(column: $table.variantId, builder: (column) => column);

  GeneratedColumn<int> get productBatchId => $composableBuilder(
      column: $table.productBatchId, builder: (column) => column);

  GeneratedColumn<String> get code =>
      $composableBuilder(column: $table.code, builder: (column) => column);

  GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  GeneratedColumn<double> get qty =>
      $composableBuilder(column: $table.qty, builder: (column) => column);

  GeneratedColumn<double> get netUnitPrice => $composableBuilder(
      column: $table.netUnitPrice, builder: (column) => column);

  GeneratedColumn<double> get discount =>
      $composableBuilder(column: $table.discount, builder: (column) => column);

  GeneratedColumn<double> get taxRate =>
      $composableBuilder(column: $table.taxRate, builder: (column) => column);

  GeneratedColumn<double> get tax =>
      $composableBuilder(column: $table.tax, builder: (column) => column);

  GeneratedColumn<double> get total =>
      $composableBuilder(column: $table.total, builder: (column) => column);

  GeneratedColumn<String> get saleUnit =>
      $composableBuilder(column: $table.saleUnit, builder: (column) => column);

  GeneratedColumn<String> get imeiNumber => $composableBuilder(
      column: $table.imeiNumber, builder: (column) => column);

  $$LocalSalesTableAnnotationComposer get localSaleId {
    final $$LocalSalesTableAnnotationComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.localSaleId,
        referencedTable: $db.localSales,
        getReferencedColumn: (t) => t.id,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            $$LocalSalesTableAnnotationComposer(
              $db: $db,
              $table: $db.localSales,
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return composer;
  }
}

class $$LocalSaleLinesTableTableManager extends RootTableManager<
    _$AppDatabase,
    $LocalSaleLinesTable,
    LocalSaleLine,
    $$LocalSaleLinesTableFilterComposer,
    $$LocalSaleLinesTableOrderingComposer,
    $$LocalSaleLinesTableAnnotationComposer,
    $$LocalSaleLinesTableCreateCompanionBuilder,
    $$LocalSaleLinesTableUpdateCompanionBuilder,
    (LocalSaleLine, $$LocalSaleLinesTableReferences),
    LocalSaleLine,
    PrefetchHooks Function({bool localSaleId})> {
  $$LocalSaleLinesTableTableManager(
      _$AppDatabase db, $LocalSaleLinesTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalSaleLinesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalSaleLinesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalSaleLinesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<int> id = const Value.absent(),
            Value<int> localSaleId = const Value.absent(),
            Value<int> productId = const Value.absent(),
            Value<int?> variantId = const Value.absent(),
            Value<int?> productBatchId = const Value.absent(),
            Value<String?> code = const Value.absent(),
            Value<String?> name = const Value.absent(),
            Value<double> qty = const Value.absent(),
            Value<double> netUnitPrice = const Value.absent(),
            Value<double> discount = const Value.absent(),
            Value<double> taxRate = const Value.absent(),
            Value<double> tax = const Value.absent(),
            Value<double> total = const Value.absent(),
            Value<String> saleUnit = const Value.absent(),
            Value<String?> imeiNumber = const Value.absent(),
          }) =>
              LocalSaleLinesCompanion(
            id: id,
            localSaleId: localSaleId,
            productId: productId,
            variantId: variantId,
            productBatchId: productBatchId,
            code: code,
            name: name,
            qty: qty,
            netUnitPrice: netUnitPrice,
            discount: discount,
            taxRate: taxRate,
            tax: tax,
            total: total,
            saleUnit: saleUnit,
            imeiNumber: imeiNumber,
          ),
          createCompanionCallback: ({
            Value<int> id = const Value.absent(),
            required int localSaleId,
            required int productId,
            Value<int?> variantId = const Value.absent(),
            Value<int?> productBatchId = const Value.absent(),
            Value<String?> code = const Value.absent(),
            Value<String?> name = const Value.absent(),
            required double qty,
            required double netUnitPrice,
            Value<double> discount = const Value.absent(),
            Value<double> taxRate = const Value.absent(),
            Value<double> tax = const Value.absent(),
            required double total,
            Value<String> saleUnit = const Value.absent(),
            Value<String?> imeiNumber = const Value.absent(),
          }) =>
              LocalSaleLinesCompanion.insert(
            id: id,
            localSaleId: localSaleId,
            productId: productId,
            variantId: variantId,
            productBatchId: productBatchId,
            code: code,
            name: name,
            qty: qty,
            netUnitPrice: netUnitPrice,
            discount: discount,
            taxRate: taxRate,
            tax: tax,
            total: total,
            saleUnit: saleUnit,
            imeiNumber: imeiNumber,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (
                    e.readTable(table),
                    $$LocalSaleLinesTableReferences(db, table, e)
                  ))
              .toList(),
          prefetchHooksCallback: ({localSaleId = false}) {
            return PrefetchHooks(
              db: db,
              explicitlyWatchedTables: [],
              addJoins: <
                  T extends TableManagerState<
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic>>(state) {
                if (localSaleId) {
                  state = state.withJoin(
                    currentTable: table,
                    currentColumn: table.localSaleId,
                    referencedTable:
                        $$LocalSaleLinesTableReferences._localSaleIdTable(db),
                    referencedColumn: $$LocalSaleLinesTableReferences
                        ._localSaleIdTable(db)
                        .id,
                  ) as T;
                }

                return state;
              },
              getPrefetchedDataCallback: (items) async {
                return [];
              },
            );
          },
        ));
}

typedef $$LocalSaleLinesTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $LocalSaleLinesTable,
    LocalSaleLine,
    $$LocalSaleLinesTableFilterComposer,
    $$LocalSaleLinesTableOrderingComposer,
    $$LocalSaleLinesTableAnnotationComposer,
    $$LocalSaleLinesTableCreateCompanionBuilder,
    $$LocalSaleLinesTableUpdateCompanionBuilder,
    (LocalSaleLine, $$LocalSaleLinesTableReferences),
    LocalSaleLine,
    PrefetchHooks Function({bool localSaleId})>;
typedef $$LocalReturnsTableCreateCompanionBuilder = LocalReturnsCompanion
    Function({
  Value<int> id,
  required String clientUuid,
  Value<int?> saleId,
  required String saleReferenceNo,
  required int warehouseId,
  required int customerId,
  Value<String?> referenceNo,
  required double grandTotal,
  Value<double> settledAmount,
  required String payloadJson,
  Value<String> syncStatus,
  Value<int?> serverReturnId,
  Value<String?> serverReferenceNo,
  Value<String?> errorMessage,
  Value<DateTime> createdAt,
  Value<DateTime?> syncedAt,
});
typedef $$LocalReturnsTableUpdateCompanionBuilder = LocalReturnsCompanion
    Function({
  Value<int> id,
  Value<String> clientUuid,
  Value<int?> saleId,
  Value<String> saleReferenceNo,
  Value<int> warehouseId,
  Value<int> customerId,
  Value<String?> referenceNo,
  Value<double> grandTotal,
  Value<double> settledAmount,
  Value<String> payloadJson,
  Value<String> syncStatus,
  Value<int?> serverReturnId,
  Value<String?> serverReferenceNo,
  Value<String?> errorMessage,
  Value<DateTime> createdAt,
  Value<DateTime?> syncedAt,
});

class $$LocalReturnsTableFilterComposer
    extends Composer<_$AppDatabase, $LocalReturnsTable> {
  $$LocalReturnsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get clientUuid => $composableBuilder(
      column: $table.clientUuid, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get saleId => $composableBuilder(
      column: $table.saleId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get saleReferenceNo => $composableBuilder(
      column: $table.saleReferenceNo,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get warehouseId => $composableBuilder(
      column: $table.warehouseId, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get customerId => $composableBuilder(
      column: $table.customerId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get referenceNo => $composableBuilder(
      column: $table.referenceNo, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get grandTotal => $composableBuilder(
      column: $table.grandTotal, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get settledAmount => $composableBuilder(
      column: $table.settledAmount, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get payloadJson => $composableBuilder(
      column: $table.payloadJson, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get syncStatus => $composableBuilder(
      column: $table.syncStatus, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get serverReturnId => $composableBuilder(
      column: $table.serverReturnId,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get serverReferenceNo => $composableBuilder(
      column: $table.serverReferenceNo,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get errorMessage => $composableBuilder(
      column: $table.errorMessage, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get syncedAt => $composableBuilder(
      column: $table.syncedAt, builder: (column) => ColumnFilters(column));
}

class $$LocalReturnsTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalReturnsTable> {
  $$LocalReturnsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get clientUuid => $composableBuilder(
      column: $table.clientUuid, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get saleId => $composableBuilder(
      column: $table.saleId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get saleReferenceNo => $composableBuilder(
      column: $table.saleReferenceNo,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get warehouseId => $composableBuilder(
      column: $table.warehouseId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get customerId => $composableBuilder(
      column: $table.customerId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get referenceNo => $composableBuilder(
      column: $table.referenceNo, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get grandTotal => $composableBuilder(
      column: $table.grandTotal, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get settledAmount => $composableBuilder(
      column: $table.settledAmount,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get payloadJson => $composableBuilder(
      column: $table.payloadJson, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get syncStatus => $composableBuilder(
      column: $table.syncStatus, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get serverReturnId => $composableBuilder(
      column: $table.serverReturnId,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get serverReferenceNo => $composableBuilder(
      column: $table.serverReferenceNo,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get errorMessage => $composableBuilder(
      column: $table.errorMessage,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get syncedAt => $composableBuilder(
      column: $table.syncedAt, builder: (column) => ColumnOrderings(column));
}

class $$LocalReturnsTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalReturnsTable> {
  $$LocalReturnsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get clientUuid => $composableBuilder(
      column: $table.clientUuid, builder: (column) => column);

  GeneratedColumn<int> get saleId =>
      $composableBuilder(column: $table.saleId, builder: (column) => column);

  GeneratedColumn<String> get saleReferenceNo => $composableBuilder(
      column: $table.saleReferenceNo, builder: (column) => column);

  GeneratedColumn<int> get warehouseId => $composableBuilder(
      column: $table.warehouseId, builder: (column) => column);

  GeneratedColumn<int> get customerId => $composableBuilder(
      column: $table.customerId, builder: (column) => column);

  GeneratedColumn<String> get referenceNo => $composableBuilder(
      column: $table.referenceNo, builder: (column) => column);

  GeneratedColumn<double> get grandTotal => $composableBuilder(
      column: $table.grandTotal, builder: (column) => column);

  GeneratedColumn<double> get settledAmount => $composableBuilder(
      column: $table.settledAmount, builder: (column) => column);

  GeneratedColumn<String> get payloadJson => $composableBuilder(
      column: $table.payloadJson, builder: (column) => column);

  GeneratedColumn<String> get syncStatus => $composableBuilder(
      column: $table.syncStatus, builder: (column) => column);

  GeneratedColumn<int> get serverReturnId => $composableBuilder(
      column: $table.serverReturnId, builder: (column) => column);

  GeneratedColumn<String> get serverReferenceNo => $composableBuilder(
      column: $table.serverReferenceNo, builder: (column) => column);

  GeneratedColumn<String> get errorMessage => $composableBuilder(
      column: $table.errorMessage, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<DateTime> get syncedAt =>
      $composableBuilder(column: $table.syncedAt, builder: (column) => column);
}

class $$LocalReturnsTableTableManager extends RootTableManager<
    _$AppDatabase,
    $LocalReturnsTable,
    LocalReturn,
    $$LocalReturnsTableFilterComposer,
    $$LocalReturnsTableOrderingComposer,
    $$LocalReturnsTableAnnotationComposer,
    $$LocalReturnsTableCreateCompanionBuilder,
    $$LocalReturnsTableUpdateCompanionBuilder,
    (
      LocalReturn,
      BaseReferences<_$AppDatabase, $LocalReturnsTable, LocalReturn>
    ),
    LocalReturn,
    PrefetchHooks Function()> {
  $$LocalReturnsTableTableManager(_$AppDatabase db, $LocalReturnsTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalReturnsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalReturnsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalReturnsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<int> id = const Value.absent(),
            Value<String> clientUuid = const Value.absent(),
            Value<int?> saleId = const Value.absent(),
            Value<String> saleReferenceNo = const Value.absent(),
            Value<int> warehouseId = const Value.absent(),
            Value<int> customerId = const Value.absent(),
            Value<String?> referenceNo = const Value.absent(),
            Value<double> grandTotal = const Value.absent(),
            Value<double> settledAmount = const Value.absent(),
            Value<String> payloadJson = const Value.absent(),
            Value<String> syncStatus = const Value.absent(),
            Value<int?> serverReturnId = const Value.absent(),
            Value<String?> serverReferenceNo = const Value.absent(),
            Value<String?> errorMessage = const Value.absent(),
            Value<DateTime> createdAt = const Value.absent(),
            Value<DateTime?> syncedAt = const Value.absent(),
          }) =>
              LocalReturnsCompanion(
            id: id,
            clientUuid: clientUuid,
            saleId: saleId,
            saleReferenceNo: saleReferenceNo,
            warehouseId: warehouseId,
            customerId: customerId,
            referenceNo: referenceNo,
            grandTotal: grandTotal,
            settledAmount: settledAmount,
            payloadJson: payloadJson,
            syncStatus: syncStatus,
            serverReturnId: serverReturnId,
            serverReferenceNo: serverReferenceNo,
            errorMessage: errorMessage,
            createdAt: createdAt,
            syncedAt: syncedAt,
          ),
          createCompanionCallback: ({
            Value<int> id = const Value.absent(),
            required String clientUuid,
            Value<int?> saleId = const Value.absent(),
            required String saleReferenceNo,
            required int warehouseId,
            required int customerId,
            Value<String?> referenceNo = const Value.absent(),
            required double grandTotal,
            Value<double> settledAmount = const Value.absent(),
            required String payloadJson,
            Value<String> syncStatus = const Value.absent(),
            Value<int?> serverReturnId = const Value.absent(),
            Value<String?> serverReferenceNo = const Value.absent(),
            Value<String?> errorMessage = const Value.absent(),
            Value<DateTime> createdAt = const Value.absent(),
            Value<DateTime?> syncedAt = const Value.absent(),
          }) =>
              LocalReturnsCompanion.insert(
            id: id,
            clientUuid: clientUuid,
            saleId: saleId,
            saleReferenceNo: saleReferenceNo,
            warehouseId: warehouseId,
            customerId: customerId,
            referenceNo: referenceNo,
            grandTotal: grandTotal,
            settledAmount: settledAmount,
            payloadJson: payloadJson,
            syncStatus: syncStatus,
            serverReturnId: serverReturnId,
            serverReferenceNo: serverReferenceNo,
            errorMessage: errorMessage,
            createdAt: createdAt,
            syncedAt: syncedAt,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$LocalReturnsTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $LocalReturnsTable,
    LocalReturn,
    $$LocalReturnsTableFilterComposer,
    $$LocalReturnsTableOrderingComposer,
    $$LocalReturnsTableAnnotationComposer,
    $$LocalReturnsTableCreateCompanionBuilder,
    $$LocalReturnsTableUpdateCompanionBuilder,
    (
      LocalReturn,
      BaseReferences<_$AppDatabase, $LocalReturnsTable, LocalReturn>
    ),
    LocalReturn,
    PrefetchHooks Function()>;
typedef $$LocalExchangesTableCreateCompanionBuilder = LocalExchangesCompanion
    Function({
  Value<int> id,
  required String clientUuid,
  Value<int?> saleId,
  required String saleReferenceNo,
  required int warehouseId,
  required int customerId,
  Value<String?> referenceNo,
  required double balance,
  Value<String?> paymentType,
  required String payloadJson,
  Value<String> syncStatus,
  Value<int?> serverExchangeId,
  Value<String?> serverReferenceNo,
  Value<String?> errorMessage,
  Value<DateTime> createdAt,
  Value<DateTime?> syncedAt,
});
typedef $$LocalExchangesTableUpdateCompanionBuilder = LocalExchangesCompanion
    Function({
  Value<int> id,
  Value<String> clientUuid,
  Value<int?> saleId,
  Value<String> saleReferenceNo,
  Value<int> warehouseId,
  Value<int> customerId,
  Value<String?> referenceNo,
  Value<double> balance,
  Value<String?> paymentType,
  Value<String> payloadJson,
  Value<String> syncStatus,
  Value<int?> serverExchangeId,
  Value<String?> serverReferenceNo,
  Value<String?> errorMessage,
  Value<DateTime> createdAt,
  Value<DateTime?> syncedAt,
});

class $$LocalExchangesTableFilterComposer
    extends Composer<_$AppDatabase, $LocalExchangesTable> {
  $$LocalExchangesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get clientUuid => $composableBuilder(
      column: $table.clientUuid, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get saleId => $composableBuilder(
      column: $table.saleId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get saleReferenceNo => $composableBuilder(
      column: $table.saleReferenceNo,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get warehouseId => $composableBuilder(
      column: $table.warehouseId, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get customerId => $composableBuilder(
      column: $table.customerId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get referenceNo => $composableBuilder(
      column: $table.referenceNo, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get balance => $composableBuilder(
      column: $table.balance, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get paymentType => $composableBuilder(
      column: $table.paymentType, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get payloadJson => $composableBuilder(
      column: $table.payloadJson, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get syncStatus => $composableBuilder(
      column: $table.syncStatus, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get serverExchangeId => $composableBuilder(
      column: $table.serverExchangeId,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get serverReferenceNo => $composableBuilder(
      column: $table.serverReferenceNo,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get errorMessage => $composableBuilder(
      column: $table.errorMessage, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get syncedAt => $composableBuilder(
      column: $table.syncedAt, builder: (column) => ColumnFilters(column));
}

class $$LocalExchangesTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalExchangesTable> {
  $$LocalExchangesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get clientUuid => $composableBuilder(
      column: $table.clientUuid, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get saleId => $composableBuilder(
      column: $table.saleId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get saleReferenceNo => $composableBuilder(
      column: $table.saleReferenceNo,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get warehouseId => $composableBuilder(
      column: $table.warehouseId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get customerId => $composableBuilder(
      column: $table.customerId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get referenceNo => $composableBuilder(
      column: $table.referenceNo, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get balance => $composableBuilder(
      column: $table.balance, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get paymentType => $composableBuilder(
      column: $table.paymentType, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get payloadJson => $composableBuilder(
      column: $table.payloadJson, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get syncStatus => $composableBuilder(
      column: $table.syncStatus, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get serverExchangeId => $composableBuilder(
      column: $table.serverExchangeId,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get serverReferenceNo => $composableBuilder(
      column: $table.serverReferenceNo,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get errorMessage => $composableBuilder(
      column: $table.errorMessage,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get syncedAt => $composableBuilder(
      column: $table.syncedAt, builder: (column) => ColumnOrderings(column));
}

class $$LocalExchangesTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalExchangesTable> {
  $$LocalExchangesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get clientUuid => $composableBuilder(
      column: $table.clientUuid, builder: (column) => column);

  GeneratedColumn<int> get saleId =>
      $composableBuilder(column: $table.saleId, builder: (column) => column);

  GeneratedColumn<String> get saleReferenceNo => $composableBuilder(
      column: $table.saleReferenceNo, builder: (column) => column);

  GeneratedColumn<int> get warehouseId => $composableBuilder(
      column: $table.warehouseId, builder: (column) => column);

  GeneratedColumn<int> get customerId => $composableBuilder(
      column: $table.customerId, builder: (column) => column);

  GeneratedColumn<String> get referenceNo => $composableBuilder(
      column: $table.referenceNo, builder: (column) => column);

  GeneratedColumn<double> get balance =>
      $composableBuilder(column: $table.balance, builder: (column) => column);

  GeneratedColumn<String> get paymentType => $composableBuilder(
      column: $table.paymentType, builder: (column) => column);

  GeneratedColumn<String> get payloadJson => $composableBuilder(
      column: $table.payloadJson, builder: (column) => column);

  GeneratedColumn<String> get syncStatus => $composableBuilder(
      column: $table.syncStatus, builder: (column) => column);

  GeneratedColumn<int> get serverExchangeId => $composableBuilder(
      column: $table.serverExchangeId, builder: (column) => column);

  GeneratedColumn<String> get serverReferenceNo => $composableBuilder(
      column: $table.serverReferenceNo, builder: (column) => column);

  GeneratedColumn<String> get errorMessage => $composableBuilder(
      column: $table.errorMessage, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<DateTime> get syncedAt =>
      $composableBuilder(column: $table.syncedAt, builder: (column) => column);
}

class $$LocalExchangesTableTableManager extends RootTableManager<
    _$AppDatabase,
    $LocalExchangesTable,
    LocalExchange,
    $$LocalExchangesTableFilterComposer,
    $$LocalExchangesTableOrderingComposer,
    $$LocalExchangesTableAnnotationComposer,
    $$LocalExchangesTableCreateCompanionBuilder,
    $$LocalExchangesTableUpdateCompanionBuilder,
    (
      LocalExchange,
      BaseReferences<_$AppDatabase, $LocalExchangesTable, LocalExchange>
    ),
    LocalExchange,
    PrefetchHooks Function()> {
  $$LocalExchangesTableTableManager(
      _$AppDatabase db, $LocalExchangesTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalExchangesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalExchangesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalExchangesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<int> id = const Value.absent(),
            Value<String> clientUuid = const Value.absent(),
            Value<int?> saleId = const Value.absent(),
            Value<String> saleReferenceNo = const Value.absent(),
            Value<int> warehouseId = const Value.absent(),
            Value<int> customerId = const Value.absent(),
            Value<String?> referenceNo = const Value.absent(),
            Value<double> balance = const Value.absent(),
            Value<String?> paymentType = const Value.absent(),
            Value<String> payloadJson = const Value.absent(),
            Value<String> syncStatus = const Value.absent(),
            Value<int?> serverExchangeId = const Value.absent(),
            Value<String?> serverReferenceNo = const Value.absent(),
            Value<String?> errorMessage = const Value.absent(),
            Value<DateTime> createdAt = const Value.absent(),
            Value<DateTime?> syncedAt = const Value.absent(),
          }) =>
              LocalExchangesCompanion(
            id: id,
            clientUuid: clientUuid,
            saleId: saleId,
            saleReferenceNo: saleReferenceNo,
            warehouseId: warehouseId,
            customerId: customerId,
            referenceNo: referenceNo,
            balance: balance,
            paymentType: paymentType,
            payloadJson: payloadJson,
            syncStatus: syncStatus,
            serverExchangeId: serverExchangeId,
            serverReferenceNo: serverReferenceNo,
            errorMessage: errorMessage,
            createdAt: createdAt,
            syncedAt: syncedAt,
          ),
          createCompanionCallback: ({
            Value<int> id = const Value.absent(),
            required String clientUuid,
            Value<int?> saleId = const Value.absent(),
            required String saleReferenceNo,
            required int warehouseId,
            required int customerId,
            Value<String?> referenceNo = const Value.absent(),
            required double balance,
            Value<String?> paymentType = const Value.absent(),
            required String payloadJson,
            Value<String> syncStatus = const Value.absent(),
            Value<int?> serverExchangeId = const Value.absent(),
            Value<String?> serverReferenceNo = const Value.absent(),
            Value<String?> errorMessage = const Value.absent(),
            Value<DateTime> createdAt = const Value.absent(),
            Value<DateTime?> syncedAt = const Value.absent(),
          }) =>
              LocalExchangesCompanion.insert(
            id: id,
            clientUuid: clientUuid,
            saleId: saleId,
            saleReferenceNo: saleReferenceNo,
            warehouseId: warehouseId,
            customerId: customerId,
            referenceNo: referenceNo,
            balance: balance,
            paymentType: paymentType,
            payloadJson: payloadJson,
            syncStatus: syncStatus,
            serverExchangeId: serverExchangeId,
            serverReferenceNo: serverReferenceNo,
            errorMessage: errorMessage,
            createdAt: createdAt,
            syncedAt: syncedAt,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$LocalExchangesTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $LocalExchangesTable,
    LocalExchange,
    $$LocalExchangesTableFilterComposer,
    $$LocalExchangesTableOrderingComposer,
    $$LocalExchangesTableAnnotationComposer,
    $$LocalExchangesTableCreateCompanionBuilder,
    $$LocalExchangesTableUpdateCompanionBuilder,
    (
      LocalExchange,
      BaseReferences<_$AppDatabase, $LocalExchangesTable, LocalExchange>
    ),
    LocalExchange,
    PrefetchHooks Function()>;

class $AppDatabaseManager {
  final _$AppDatabase _db;
  $AppDatabaseManager(this._db);
  $$DeviceSessionTableTableManager get deviceSession =>
      $$DeviceSessionTableTableManager(_db, _db.deviceSession);
  $$SyncMetaTableTableManager get syncMeta =>
      $$SyncMetaTableTableManager(_db, _db.syncMeta);
  $$WarehousesTableTableManager get warehouses =>
      $$WarehousesTableTableManager(_db, _db.warehouses);
  $$LocalUsersTableTableManager get localUsers =>
      $$LocalUsersTableTableManager(_db, _db.localUsers);
  $$CategoriesTableTableManager get categories =>
      $$CategoriesTableTableManager(_db, _db.categories);
  $$BrandsTableTableManager get brands =>
      $$BrandsTableTableManager(_db, _db.brands);
  $$TaxesTableTableManager get taxes =>
      $$TaxesTableTableManager(_db, _db.taxes);
  $$UnitsTableTableManager get units =>
      $$UnitsTableTableManager(_db, _db.units);
  $$CustomersTableTableManager get customers =>
      $$CustomersTableTableManager(_db, _db.customers);
  $$LocalCouponsTableTableManager get localCoupons =>
      $$LocalCouponsTableTableManager(_db, _db.localCoupons);
  $$BillersTableTableManager get billers =>
      $$BillersTableTableManager(_db, _db.billers);
  $$ProductsTableTableManager get products =>
      $$ProductsTableTableManager(_db, _db.products);
  $$ProductVariantsTableTableManager get productVariants =>
      $$ProductVariantsTableTableManager(_db, _db.productVariants);
  $$ProductStockTableTableManager get productStock =>
      $$ProductStockTableTableManager(_db, _db.productStock);
  $$LocalSalesTableTableManager get localSales =>
      $$LocalSalesTableTableManager(_db, _db.localSales);
  $$LocalSaleLinesTableTableManager get localSaleLines =>
      $$LocalSaleLinesTableTableManager(_db, _db.localSaleLines);
  $$LocalReturnsTableTableManager get localReturns =>
      $$LocalReturnsTableTableManager(_db, _db.localReturns);
  $$LocalExchangesTableTableManager get localExchanges =>
      $$LocalExchangesTableTableManager(_db, _db.localExchanges);
}
