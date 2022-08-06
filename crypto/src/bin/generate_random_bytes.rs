use rand::Rng;

fn main() {
    const lenght: usize = 16;
    let random_bytes = rand::thread_rng().gen::<[u8; lenght]>();
    println!("{:?}", random_bytes);
}
