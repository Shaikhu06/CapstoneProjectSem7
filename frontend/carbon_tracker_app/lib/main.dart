// lib/main.dart
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:fl_chart/fl_chart.dart';

void main() => runApp(CarbonApp());

const String BACKEND_BASE = 'http://10.0.2.2:4000'; // Android emulator; use localhost for iOS/simulator or ngrok URL for device

class CarbonApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Carbon Tracker MVP',
      theme: ThemeData(primarySwatch: Colors.green),
      home: HomePage(),
    );
  }
}

class HomePage extends StatefulWidget { @override _HomePageState createState() => _HomePageState(); }

class _HomePageState extends State<HomePage> {
  String category = 'Travel';
  String activity = 'Petrol Car';
  double value = 0;
  double lastEmission = 0;
  Map<String, List<String>> factorItems = {};
  List history = [];
  List summary = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    fetchFactors();
    fetchSummary();
  }

  Future<void> fetchFactors() async {
    try {
      final res = await http.get(Uri.parse('$BACKEND_BASE/api/emission-factors'));
      if (res.statusCode == 200) {
        final rows = jsonDecode(res.body) as List;
        final map = <String, List<String>>{};
        for (var r in rows) {
          final cat = r['category'] ?? 'Other';
          final it = r['item'] ?? 'Unknown';
          map.putIfAbsent(cat, () => []).add(it);
        }
        setState(() {
          factorItems = map;
          category = map.keys.first;
          activity = map[category]!.first;
          loading = false;
        });
      } else {
        setState(() => loading = false);
      }
    } catch (e) { setState(() => loading = false); }
  }

  Future<void> addActivity() async {
    final body = {
      'user_id': 1,
      'category': category,
      'activity': activity,
      'value': value,
      'unit': category == 'Travel' ? 'km' : (category == 'Food' ? 'meal' : '₹'),
      'date': DateTime.now().toIso8601String().split('T')[0]
    };
    final res = await http.post(Uri.parse('$BACKEND_BASE/api/activity'),
        headers: {'Content-Type': 'application/json'}, body: jsonEncode(body));
    if (res.statusCode == 200) {
      final js = jsonDecode(res.body);
      setState(() {
        lastEmission = (js['emission_kg'] ?? 0).toDouble();
      });
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Emission added: ${lastEmission.toStringAsFixed(2)} kg')));
      fetchSummary();
      fetchHistory();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error adding activity')));
    }
  }

  Future<void> fetchSummary() async {
    try {
      final d = DateTime.now().toIso8601String().split('T')[0];
      final res = await http.get(Uri.parse('$BACKEND_BASE/api/summary?user_id=1&date=$d'));
      if (res.statusCode == 200) {
        final js = jsonDecode(res.body);
        setState(() {
          summary = (js['data'] as List).map((e) => {'category': e['category'], 'total': (e['total'] as num).toDouble()}).toList();
        });
      }
    } catch (e) {}
  }

  Future<void> fetchHistory() async {
    try {
      final d = DateTime.now().toIso8601String().split('T')[0];
      final res = await http.get(Uri.parse('$BACKEND_BASE/api/history?user_id=1&from=$d&to=$d'));
      if (res.statusCode == 200) {
        setState(() {
          history = jsonDecode(res.body);
        });
      }
    } catch (e) {}
  }

  Widget _buildPie() {
    if (summary.isEmpty) return Center(child: Text('No data for today'));
    final sections = <PieChartSectionData>[];
    double total = 0;
    summary.forEach((s) => total += (s['total'] as double));
    for (var s in summary) {
      final val = (s['total'] as double);
      final pct = total == 0 ? 0.0 : (val / total) * 100;
      sections.add(PieChartSectionData(value: val, title: '${s['category']}\n${val.toStringAsFixed(1)}kg\n(${pct.toStringAsFixed(0)}%)', radius: 60));
    }
    return PieChart(PieChartData(sections: sections, sectionsSpace: 2, centerSpaceRadius: 20));
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return Scaffold(body: Center(child: CircularProgressIndicator()));
    return Scaffold(
      appBar: AppBar(title: Text('Carbon MVP')),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(12),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Quick Add', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          SizedBox(height: 8),
          DropdownButton<String>(
            value: category,
            items: factorItems.keys.map((k) => DropdownMenuItem(child: Text(k), value: k)).toList(),
            onChanged: (v) => setState(() {
              category = v!;
              activity = factorItems[category]!.first;
            }),
          ),
          SizedBox(height: 8),
          DropdownButton<String>(
            value: activity,
            items: factorItems[category]!.map((it) => DropdownMenuItem(child: Text(it), value: it)).toList(),
            onChanged: (v) => setState(() => activity = v!),
          ),
          SizedBox(height: 8),
          TextField(
            decoration: InputDecoration(labelText: category == 'Travel' ? 'Distance (km)' : (category == 'Food' ? 'No. of meals' : 'Amount ₹')),
            keyboardType: TextInputType.number,
            onChanged: (t) => setState(() => value = double.tryParse(t) ?? 0),
          ),
          SizedBox(height: 12),
          ElevatedButton.icon(icon: Icon(Icons.add), label: Text('Add Activity'), onPressed: addActivity),
          SizedBox(height: 16),
          Text('Last emission: ${lastEmission.toStringAsFixed(2)} kg', style: TextStyle(fontSize: 16)),
          Divider(),
          Text('Today Summary', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          SizedBox(height: 8),
          Container(height: 220, child: _buildPie()),
          Divider(),
          Text('Today History', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          ...history.map((h) => ListTile(
            title: Text('${h['activity']} (${h['value']}${h['unit'] ?? ''})'),
            subtitle: Text('${h['emission_kg']?.toStringAsFixed(2)} kg - ${h['log_date']}'),
            dense: true,
          )),
          SizedBox(height: 24),
          Center(child: Text('Simple badges: add 3 logs to get "Getting Started" badge')),
        ]),
      ),
    );
  }
}
